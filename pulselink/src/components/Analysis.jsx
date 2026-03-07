import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTriage } from '../context/TriageContext';
import { uploadToCloudinary } from '../services/cloudinary';
import { extractFrames } from '../services/frameExtractor';
import { analyzeScene } from '../services/gemini';
import { fetchPresageVitals } from '../services/presage';

const PHASES = [
  'Uploading to cloud...',
  'Extracting video frames...',
  'Analyzing scene with AI...',
  'Reading biometric vitals...',
  'Finalizing assessment...',
];

export default function Analysis() {
  const navigate = useNavigate();
  const { videoBlob, setCloudinaryData, setTriageData, setPresageData } = useTriage();
  const [phase, setPhase] = useState(0);
  const [error, setError] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    if (!videoBlob || started.current) {
      if (!videoBlob) navigate('/capture');
      return;
    }
    started.current = true;

    (async () => {
      try {
        // Phase 0: Upload to Cloudinary
        setPhase(0);
        const cloudData = await uploadToCloudinary(videoBlob);
        setCloudinaryData(cloudData);

        // Phase 1: Extract frames
        setPhase(1);
        const frames = await extractFrames(cloudData.secure_url);

        // Phase 2 & 3: Gemini + Presage in parallel
        setPhase(2);
        const [geminiResult, presageResult] = await Promise.allSettled([
          analyzeScene(frames),
          fetchPresageVitals(cloudData.secure_url).then(r => { setPhase(3); return r; }),
        ]);

        const triage = geminiResult.status === 'fulfilled' ? geminiResult.value : null;
        const presage = presageResult.status === 'fulfilled' ? presageResult.value : null;

        if (!triage) throw new Error('Scene analysis failed');

        // Merge Presage vitals into triage data
        if (presage?.data) {
          const pd = presage.data;
          if (pd.pulse_rate != null) {
            triage.vitals.heart_rate.estimate = Math.round(pd.pulse_rate);
            triage.vitals.heart_rate.source = 'Presage SmartSpectra';
            triage.vitals.heart_rate.confidence = 'high';
          } else if (pd.pulse_rate_available === false || pd.readings_count != null || pd.error) {
            triage.vitals.heart_rate.estimate = 80; // failsafe default when no signal
            triage.vitals.heart_rate.source = 'Presage SmartSpectra';
            triage.vitals.heart_rate.confidence = 'low';
          }
          if (pd.breathing_rate != null) {
            triage.vitals.breathing_rate.estimate = Math.round(pd.breathing_rate);
            triage.vitals.breathing_rate.source = 'Presage SmartSpectra';
            triage.vitals.breathing_rate.confidence = 'high';
          } else if (pd.breathing_rate_available === false || pd.readings_count != null || pd.error) {
            triage.vitals.breathing_rate.estimate = 15; // failsafe default when no signal (per min)
            triage.vitals.breathing_rate.source = 'Presage SmartSpectra';
            triage.vitals.breathing_rate.confidence = 'low';
          }
        }

        // Tag AI-estimated vitals
        if (!triage.vitals.heart_rate.source) triage.vitals.heart_rate.source = 'AI Estimated';
        if (!triage.vitals.breathing_rate.source) triage.vitals.breathing_rate.source = 'AI Estimated';

        // Failsafe: ensure dashboard always shows numeric defaults when no reading
        if (typeof triage.vitals.heart_rate.estimate !== 'number') {
          triage.vitals.heart_rate.estimate = 80;
          triage.vitals.heart_rate.confidence = triage.vitals.heart_rate.confidence || 'low';
        }
        if (typeof triage.vitals.breathing_rate.estimate !== 'number') {
          triage.vitals.breathing_rate.estimate = 15;
          triage.vitals.breathing_rate.confidence = triage.vitals.breathing_rate.confidence || 'low';
        }

        setTriageData(triage);
        setPresageData(presage);

        setPhase(4);
        setTimeout(() => navigate('/dashboard'), 600);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [videoBlob]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {error ? (
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/capture')}
            className="px-6 py-3 bg-[var(--bg-card)] rounded-xl text-[var(--text-primary)] cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="text-center max-w-sm">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 mx-auto mb-6 border-3 border-[var(--border)] border-t-red-500 rounded-full"
          />
          <p className="text-lg font-medium mb-4">{PHASES[phase]}</p>
          <div className="flex gap-1.5 justify-center">
            {PHASES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i <= phase ? 'w-8 bg-red-500' : 'w-4 bg-[var(--border)]'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
