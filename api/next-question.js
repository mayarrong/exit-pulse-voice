<<<<<<< HEAD
// File: /api/next-question.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { conversation } = req.body;

  if (!conversation) {
    return res.status(400).json({ error: 'Missing conversation input' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an empathetic HR assistant conducting a voice-based exit interview.' },
          ...conversation.map(c => [
            { role: 'assistant', content: c.question },
            { role: 'user', content: c.answer }
          ]).flat(),
          { role: 'assistant', content: 'What would you like to ask next?' }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Error:", data);
      return res.status(500).json({ error: 'OpenAI request failed', details: data });
    }

    const nextQuestion = data.choices?.[0]?.message?.content?.trim() || null;
    res.status(200).json({ question: nextQuestion });

  } catch (err) {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
=======
import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { conversation } = req.body;

  try {
    // Format past Q&A conversation as prompt history
    const history = conversation
      .map((c, i) => `Q${i + 1}: ${c.question}\nA${i + 1}: ${c.answer}`)
      .join('\n');

    // Construct prompt for AI to generate next exit interview question
    const prompt = `
You're an empathetic HR assistant conducting a structured exit interview.
Ask one thoughtful question at a time, based on this conversation:

${history}

Now ask the next question:
`;

    //  MODEL CHANGE HERE:
    // Use 'gpt-3.5-turbo' instead of the more expensive 'gpt-4o'
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const nextQ = completion.choices?.[0]?.message?.content?.trim();

    if (!nextQ) {
      return res.status(500).json({ error: 'No question returned from OpenAI.' });
    }

    res.status(200).json({ question: nextQ });
  } catch (err) {
    console.error('OpenAI Error:', err.message || err);
    res.status(500).json({ error: 'Failed to generate next question.' });
  }
}
>>>>>>> 8f37d31 (Reinitialize project)
