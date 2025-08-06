export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { conversation } = req.body;

  // Construct messages for OpenAI chat completion
  const messages = [
    {
      role: 'system',
      content: 'You are an empathetic HR AI conducting an exit interview. Based on the conversation so far, ask a meaningful next question to understand why the employee is leaving.'
    },
    // Flatten the conversation: each Q as user message, each A as assistant message
    ...conversation.flatMap((entry) => [
      { role: 'user', content: entry.question },
      { role: 'assistant', content: entry.answer }
    ]),
    // Ask for the next question from the AI
    { role: 'user', content: 'What is the next question?' }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return res.status(500).json({ error: 'OpenAI API error' });
    }

    const data = await response.json();
    const question = data.choices?.[0]?.message?.content?.trim();

    if (!question) {
      return res.status(500).json({ error: 'Failed to generate question' });
    }

    return res.status(200).json({ question });
  } catch (err) {
    console.error('❌ Error in /api/next-question:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
