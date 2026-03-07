import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { speakText } from '../services/elevenlabs';
import { sendChatMessage } from '../services/gemini';

export default function VoiceAgent({ chatHistory, onChatUpdate, onMessage }) {
  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const historyRef = useRef(chatHistory);
  historyRef.current = chatHistory;

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      onMessage?.({ role: 'user', text: transcript });

      setSpeaking(true);
      try {
        const { text, contents } = await sendChatMessage(transcript, historyRef.current);
        onChatUpdate?.(contents);
        onMessage?.({ role: 'ai', text });
        await speakText(text);
      } catch {
        // silently continue
      }
      setSpeaking(false);

      if (recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = () => {
      setListening(false);
      if (active && recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.start();
  }, [active, onChatUpdate, onMessage]);

  const toggle = () => {
    if (active) {
      setActive(false);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    } else {
      setActive(true);
      startListening();
    }
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm cursor-pointer transition-all min-h-[48px] ${
        active
          ? listening
            ? 'bg-red-600 text-white animate-listening'
            : speaking
              ? 'bg-blue-600 text-white'
              : 'bg-red-600 text-white'
          : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]'
      }`}
    >
      {active ? (
        speaking ? (
          <><Volume2 className="w-5 h-5" /> AI Speaking...</>
        ) : listening ? (
          <><Mic className="w-5 h-5" /> Listening...</>
        ) : (
          <><MicOff className="w-5 h-5" /> Voice Off</>
        )
      ) : (
        <><Mic className="w-5 h-5" /> Voice Mode</>
      )}
    </button>
  );
}
