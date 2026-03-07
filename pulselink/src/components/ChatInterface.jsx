import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MicOff, Volume2 } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useTriage } from '../context/TriageContext';
import { speakText } from '../services/elevenlabs';

export default function ChatInterface({ open, onClose }) {
  const { triageData } = useTriage();
  const { messages, loading, send, initialize } = useChat(triageData);
  const [input, setInput] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (open) initialize();
  }, [open, initialize]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = useCallback(async (text, fromVoice = false) => {
    if (!text.trim()) return;
    const aiResponse = await send(text.trim());
    if (fromVoice && aiResponse) {
      setSpeaking(true);
      try {
        await speakText(aiResponse);
      } catch {}
      setSpeaking(false);
    }
    return aiResponse;
  }, [send]);

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
      setInput('');
      await handleSend(transcript, true);

      if (recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = () => {
      setListening(false);
      if (voiceActive && recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.start();
  }, [voiceActive, handleSend]);

  const toggleVoice = () => {
    if (voiceActive) {
      setVoiceActive(false);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    } else {
      setVoiceActive(true);
      startListening();
    }
  };

  const handleClose = () => {
    if (voiceActive) {
      setVoiceActive(false);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    }
    onClose();
  };

  const handleTextSend = () => {
    if (!input.trim()) return;
    handleSend(input.trim());
    setInput('');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h2 className="font-semibold">AI First Aid Coach</h2>
            <button onClick={handleClose} className="p-2 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-500/15 text-blue-100'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)]'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--bg-card)] rounded-2xl px-4 py-3 flex gap-1.5">
                  <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full typing-dot" />
                  <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full typing-dot" />
                  <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full typing-dot" />
                </div>
              </div>
            )}
            {speaking && (
              <div className="flex justify-start">
                <div className="bg-blue-600/20 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-blue-300">
                  <Volume2 className="w-4 h-4" /> Speaking...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex gap-2">
              <button
                onClick={toggleVoice}
                className={`p-3 rounded-xl cursor-pointer transition-colors ${
                  voiceActive
                    ? listening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-red-600 text-white'
                    : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]'
                }`}
              >
                {voiceActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
                placeholder={voiceActive && listening ? 'Listening...' : 'Describe what you see...'}
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent-blue)]"
              />
              <button
                onClick={handleTextSend}
                disabled={!input.trim() || loading}
                className="p-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl cursor-pointer transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
