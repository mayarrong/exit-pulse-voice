import { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { createClient } from '@supabase/supabase-js';

// 1️⃣ Supabase Client Setup
const supabase = createClient(
  'https://cqbqytvjqmkofvcyfkou.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxYnF5dHZqcW1rb2Z2Y3lma291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTY1MzgsImV4cCI6MjA2OTkzMjUzOH0.MLuzFsCwq5Ie9DQr7LLGj776mmMhNWKD_jWtd-rXXuI'
);

// 2️⃣ Text-to-Speech Function
const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
};

// 3️⃣ Function to fetch the next AI-generated question based on conversation
const getNextAIQuestion = async (conversationSoFar) => {
  const res = await fetch('/api/next-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation: conversationSoFar })
  });

  const data = await res.json();
  return data.question;
};

function App() {
  // 4️⃣ State Initialization
  const [conversation, setConversation] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);

  const {
    transcript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // 5️⃣ Load First AI Question on Mount
  useEffect(() => {
    const loadFirstQuestion = async () => {
      const firstQ = await getNextAIQuestion([]);
      setCurrentQuestion(firstQ);
      speak(firstQ);
    };
    loadFirstQuestion();
  }, []);

  // 6️⃣ Handle transcript and move to next AI question
  useEffect(() => {
    if (!listening && transcript) {
      const newEntry = {
        question: currentQuestion,
        answer: transcript.trim()
      };
      const updatedConversation = [...conversation, newEntry];
      setConversation(updatedConversation);
      resetTranscript();

      getNextAIQuestion(updatedConversation).then((nextQ) => {
        if (nextQ) {
          setCurrentQuestion(nextQ);
          setTimeout(() => speak(nextQ), 500);
        }
      });
    }
  }, [listening]);

  // 7️⃣ Start Listening to Voice Input
  const startListening = () => {
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: false });
  };

  // 8️⃣ Show error if browser doesn't support speech recognition
  if (!browserSupportsSpeechRecognition) {
    return <span>Your browser doesn't support speech recognition.</span>;
  }

  // 9️⃣ Save full conversation to Supabase after last question
  useEffect(() => {
    if (conversation.length >= 7 && currentQuestion === '') {
      const saveToDB = async () => {
        const { data, error } = await supabase.from('interviews').insert([
          { conversation: JSON.stringify(conversation) }
        ]);
        if (error) {
          console.error("❌ Error saving to DB:", error.message || error);
        } else {
          console.log("✅ Conversation saved:", data);
        }
      };
      saveToDB();
    }
  }, [conversation, currentQuestion]);

  // 🔟 Component UI
  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'Arial' }}>
      <h1>🎙️ Exit Pulse – Voice Interview</h1>

      {currentQuestion ? (
        <>
          <p><strong>AI:</strong> {currentQuestion}</p>
          <button onClick={startListening} disabled={listening}>
            {listening ? 'Listening...' : 'Answer with Voice'}
          </button>
          <p style={{ fontStyle: 'italic', color: '#666' }}>{transcript}</p>
        </>
      ) : (
        <>
          <h2>✅ Interview Complete</h2>
          {conversation.map((entry, idx) => (
            <div key={idx} style={{ marginBottom: 16 }}>
              <strong>Q:</strong> {entry.question}<br />
              <strong>A:</strong> {entry.answer}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;
