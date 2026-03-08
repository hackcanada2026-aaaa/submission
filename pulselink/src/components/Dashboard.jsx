import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Volume2, FileText, Play, X } from 'lucide-react';
import { AdvancedVideo } from '@cloudinary/react';
import { useTriage } from '../context/TriageContext';
import { getVideo } from '../services/cloudinary';
import { speakSequential } from '../services/elevenlabs';
import SeverityBanner from './SeverityBanner';
import { VitalsOverlay } from './VitalsPanel';
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
  const [videoOpen, setVideoOpen] = useState(true);
  const [helpNotificationDismissed, setHelpNotificationDismissed] = useState(false);
  const [helpNotificationProgress, setHelpNotificationProgress] = useState(100);
  const helpNotificationTimerRef = useRef(null);
  const { messages: chatMessages, history: chatHistory, send: chatSend, initialize: chatInit } = useChat(triageData);

  const severityScore = triageData?.diagnosis?.severity_score ?? 0;
  const showHelpNotification = severityScore >= 8 && !helpNotificationDismissed;

  useEffect(() => {
    if (!showHelpNotification) return;
    const durationMs = 8000;
    const intervalMs = 50;
    const step = (intervalMs / durationMs) * 100;
    setHelpNotificationProgress(100);
    helpNotificationTimerRef.current = setInterval(() => {
      setHelpNotificationProgress((p) => {
        const next = Math.max(0, p - step);
        if (next <= 0 && helpNotificationTimerRef.current) {
          clearInterval(helpNotificationTimerRef.current);
          helpNotificationTimerRef.current = null;
          setHelpNotificationDismissed(true);
        }
        return next;
      });
    }, intervalMs);
    return () => {
      if (helpNotificationTimerRef.current) clearInterval(helpNotificationTimerRef.current);
    };
  }, [showHelpNotification]);

  const dismissHelpNotification = () => {
    if (helpNotificationTimerRef.current) {
      clearInterval(helpNotificationTimerRef.current);
      helpNotificationTimerRef.current = null;
    }
    setHelpNotificationDismissed(true);
  };

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
      {showHelpNotification && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 safe-area-inset-top">
          <div className="max-w-2xl mx-auto bg-amber-500/55 backdrop-blur border border-amber-400/75 text-black rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <p className="flex-1 text-base font-medium pr-8">
                ⚠️ Help is on the way. A nearby first-aid responder has been notified.
              </p>
              <button
                onClick={dismissHelpNotification}
                className="shrink-0 p-1 rounded-lg hover:bg-amber-400/50 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-1 bg-amber-400/50">
              <div
                className="h-full bg-amber-600 transition-all duration-75 ease-linear"
                style={{ width: `${helpNotificationProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <SeverityBanner
          diagnosis={t.diagnosis}
          firstAid={t.first_aid}
          summary={t.summary}
        />

        {cloudinaryData?.public_id && (
          <div>
            <button
              onClick={() => setVideoOpen(!videoOpen)}
              className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm font-medium cursor-pointer transition-colors"
            >
              <Play className="w-4 h-4" /> {videoOpen ? 'Hide' : 'Replay'} Video
            </button>
            {videoOpen && (
              <div className="relative mt-2 rounded-xl overflow-hidden">
                <AdvancedVideo
                  cldVid={getVideo(cloudinaryData.public_id)}
                  controls
                  autoPlay
                  playsInline
                  className="w-full"
                />
                <div className="absolute top-0 left-0 right-0 pt-2 px-2 pointer-events-none">
                  <div className="pointer-events-auto w-full">
                    <VitalsOverlay vitals={t.vitals} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <InjuryPanel visualAnalysis={t.visual_analysis} />

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
