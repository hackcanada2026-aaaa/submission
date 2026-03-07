import { Phone, Volume2 } from 'lucide-react';
import { speakText } from '../services/elevenlabs';

const CATEGORY_STYLES = {
  'Immediate (Red)': 'bg-red-600 text-white',
  'Urgent (Yellow)': 'bg-amber-500 text-black',
  'Delayed (Green)': 'bg-emerald-600 text-white',
};

export default function SeverityBanner({ diagnosis, firstAid, summary }) {
  const category = diagnosis?.triage_category || 'Unknown';
  const style = CATEGORY_STYLES[category] || 'bg-gray-700 text-white';

  return (
    <div className={`${style} p-4 rounded-2xl`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-wider opacity-80">Triage</span>
          <span className="text-xl font-bold">{category}</span>
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
