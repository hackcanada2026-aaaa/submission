import { Phone, Volume2 } from 'lucide-react';
import { speakText } from '../services/elevenlabs';

const CATEGORY_STYLES = {
  'Immediate (Red)': 'bg-gradient-to-r from-red-600 to-[var(--bg-card)] text-white',
  'Urgent (Yellow)': 'bg-gradient-to-r from-amber-500 to-[var(--bg-card)] text-black',
  'Delayed (Green)': 'bg-gradient-to-r from-emerald-600 to-[var(--bg-card)] text-white',
};

const CATEGORY_LABELS = {
  'Immediate (Red)': 'Seek Immediate Help',
  'Urgent (Yellow)': 'Urgent',
  'Delayed (Green)': 'Safe',
};

export default function SeverityBanner({ diagnosis, firstAid, summary }) {
  const category = diagnosis?.triage_category || 'Unknown';
  const style = CATEGORY_STYLES[category] || 'bg-gradient-to-r from-gray-700 to-[var(--bg-card)] text-white';
  const label = CATEGORY_LABELS[category] ?? category;

  return (
    <div className={`${style} p-4 rounded-2xl`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-wider opacity-80">Status</span>
          <span className="text-xl font-bold">{label}</span>
        </div>
        <span className="font-mono text-2xl font-bold">{diagnosis?.severity_score}/10</span>
      </div>
      <p className="text-sm opacity-90 mb-3">{summary}</p>
      <div className="flex gap-2">
        {firstAid?.call_911 && (
          <a
            href="tel:911"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/20 rounded-xl font-semibold text-sm backdrop-blur min-h-[48px]"
          >
            <Phone className="w-4 h-4" /> Call 911
          </a>
        )}
        <button
          onClick={() => speakText(summary)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 rounded-xl text-sm backdrop-blur min-h-[48px] cursor-pointer"
        >
          <Volume2 className="w-4 h-4" /> Listen
        </button>
      </div>
    </div>
  );
}
