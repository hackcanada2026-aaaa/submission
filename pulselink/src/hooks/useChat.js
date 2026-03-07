import { useState, useCallback, useRef } from 'react';
import { buildInitialHistory, sendChatMessage } from '../services/gemini';

export function useChat(triageData) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const initialized = useRef(false);

  const initialize = useCallback(async () => {
    if (initialized.current || !triageData) return;
    initialized.current = true;

    const initialHistory = buildInitialHistory(triageData);
    setHistory(initialHistory);
    setLoading(true);

    try {
      const { text, contents } = await sendChatMessage('Begin now.', initialHistory);
      setHistory(contents);
      setMessages([{ role: 'ai', text }]);
    } catch {
      setMessages([{ role: 'ai', text: "I'm here to help. Can you tell me what happened?" }]);
    }
    setLoading(false);
  }, [triageData]);

  const send = useCallback(async (userText) => {
    if (!userText.trim() || loading) return null;

    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    let aiText = null;
    try {
      const { text, contents } = await sendChatMessage(userText, history);
      setHistory(contents);
      setMessages(prev => [...prev, { role: 'ai', text }]);
      aiText = text;
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Connection issue. Please try again.' }]);
    }
    setLoading(false);
    return aiText;
  }, [history, loading]);

  return { messages, loading, send, initialize, history };
}
