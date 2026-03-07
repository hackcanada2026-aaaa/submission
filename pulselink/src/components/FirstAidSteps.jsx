import { useState } from 'react';
import { Volume2, AlertOctagon, Play } from 'lucide-react';
import { speakText, speakSequential } from '../services/elevenlabs';
import { useTriage } from '../context/TriageContext';

export default function FirstAidSteps({ firstAid }) {
  const { checkedSteps, setCheckedSteps } = useTriage();
  const [speakingStep, setSpeakingStep] = useState(-1);

  if (!firstAid) return null;

  const { immediate_actions = [], do_not = [] } = firstAid;

  const toggleStep = (i) => {
    setCheckedSteps(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const readAllSteps = () => {
    speakSequential(
      immediate_actions.map((s, i) => `Step ${i + 1}: ${s}`),
      setSpeakingStep
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          First Aid Steps
        </h3>
        <button
          onClick={readAllSteps}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
        >
          <Play className="w-3.5 h-3.5" /> Read All
        </button>
      </div>

      <div className="space-y-2">
        {immediate_actions.map((step, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
              speakingStep === i
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-[var(--bg-card)] border-[var(--border)]'
            }`}
          >
            <button
              onClick={() => toggleStep(i)}
              className={`mt-0.5 w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors ${
                checkedSteps[i]
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-[var(--text-secondary)]'
              }`}
            >
              {checkedSteps[i] && <span className="text-xs font-bold">✓</span>}
            </button>
            <div className="flex-1 min-w-0">
              <span className="font-mono text-xs text-[var(--text-secondary)] mr-2">{i + 1}.</span>
              <span className={`text-lg ${checkedSteps[i] ? 'line-through opacity-50' : ''}`}>
                {step}
              </span>
            </div>
            <button
              onClick={() => speakText(`Step ${i + 1}: ${step}`)}
              className="flex-shrink-0 p-2 text-[var(--text-secondary)] hover:text-[var(--accent-blue)] cursor-pointer transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {do_not.length > 0 && (
        <div className="border-2 border-red-500/40 bg-red-500/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="w-5 h-5 text-red-400" />
            <span className="font-semibold text-red-300 text-sm uppercase">Do Not</span>
          </div>
          <ul className="space-y-1">
            {do_not.map((item, i) => (
              <li key={i} className="text-sm text-red-200 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">×</span> {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
