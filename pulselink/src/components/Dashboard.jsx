import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Volume2, FileText, Play } from 'lucide-react';
import { AdvancedVideo } from '@cloudinary/react';
import { useTriage } from '../context/TriageContext';
import { getVideo } from '../services/cloudinary';
import { speakSequential } from '../services/elevenlabs';
import SeverityBanner from './SeverityBanner';
import VitalsPanel from './VitalsPanel';
import InjuryPanel from './InjuryPanel';
import RiskFlags from './RiskFlags';
import FirstAidSteps from './FirstAidSteps';
import ChatInterface from './ChatInterface';
import IncidentReport from './IncidentReport';
import { useChat } from '../hooks/useChat';

export default function Dashboard() {
  const navigate = useNavigate();
  const { triageData, cloudinaryData } = useTriage();
  const [chatOpen, setChatOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const { messages: chatMessages, history: chatHistory, send: chatSend, initialize: chatInit } = useChat(triageData);

  if (!triageData) {
    navigate('/');
    return null;
  }

  const t = triageData;

  const handleListenAll = () => {
    const steps = t.first_aid?.immediate_actions || [];
    speakSequential(steps.map((s, i) => `Step ${i + 1}: ${s}`));
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <SeverityBanner
          diagnosis={t.diagnosis}
          firstAid={t.first_aid}
          summary={t.summary}
        />

        <VitalsPanel vitals={t.vitals} />

        <InjuryPanel visualAnalysis={t.visual_analysis} />

        {cloudinaryData?.public_id && (
          <div>
            <button
              onClick={() => setVideoOpen(!videoOpen)}
              className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm font-medium cursor-pointer transition-colors"
            >
              <Play className="w-4 h-4" /> {videoOpen ? 'Hide' : 'Replay'} Video
            </button>
            {videoOpen && (
              <div className="mt-2 rounded-xl overflow-hidden">
                <AdvancedVideo
                  cldVid={getVideo(cloudinaryData.public_id)}
                  controls
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        <RiskFlags flags={t.diagnosis?.risk_flags} />

        <FirstAidSteps firstAid={t.first_aid} />
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 no-print">
        <div className="backdrop-blur-xl bg-black/60 border-t border-[var(--border)] p-4">
          <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto">
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap min-h-[48px]"
            >
              <MessageCircle className="w-5 h-5" /> AI Coach
            </button>
            <button
              onClick={handleListenAll}
              className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap min-h-[48px]"
            >
              <Volume2 className="w-5 h-5" /> Listen
            </button>
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap min-h-[48px]"
            >
              <FileText className="w-5 h-5" /> Report
            </button>
          </div>
        </div>
      </div>

      <ChatInterface open={chatOpen} onClose={() => setChatOpen(false)} />
      <IncidentReport open={reportOpen} onClose={() => setReportOpen(false)} chatMessages={chatMessages} />
    </div>
  );
}
