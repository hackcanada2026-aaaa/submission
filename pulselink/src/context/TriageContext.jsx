import { createContext, useContext, useState } from 'react';

const TriageContext = createContext(null);

export function TriageProvider({ children }) {
  const [videoBlob, setVideoBlob] = useState(null);
  const [cloudinaryData, setCloudinaryData] = useState(null);
  const [triageData, setTriageData] = useState(null);
  const [presageData, setPresageData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [checkedSteps, setCheckedSteps] = useState({});

  const reset = () => {
    setVideoBlob(null);
    setCloudinaryData(null);
    setTriageData(null);
    setPresageData(null);
    setChatHistory([]);
    setCheckedSteps({});
  };

  return (
    <TriageContext.Provider value={{
      videoBlob, setVideoBlob,
      cloudinaryData, setCloudinaryData,
      triageData, setTriageData,
      presageData, setPresageData,
      chatHistory, setChatHistory,
      checkedSteps, setCheckedSteps,
      reset,
    }}>
      {children}
    </TriageContext.Provider>
  );
}

export const useTriage = () => {
  const ctx = useContext(TriageContext);
  if (!ctx) throw new Error('useTriage must be used within TriageProvider');
  return ctx;
};
