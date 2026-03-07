const STATUS_COLORS = {
  normal: 'text-emerald-400',
  elevated: 'text-amber-400',
  low: 'text-amber-400',
  critical: 'text-red-400',
  unknown: 'text-gray-400',
};

const CONFIDENCE_DOT = {
  high: 'bg-emerald-400',
  medium: 'bg-amber-400',
  low: 'bg-red-400',
};

function VitalCard({ label, value, status, source, confidence, animate }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  const dotColor = CONFIDENCE_DOT[confidence] || CONFIDENCE_DOT.low;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col items-center text-center">
      <span className={`font-mono text-5xl font-bold ${color} ${animate ? 'animate-pulse-vital' : ''}`}>
        {value}
      </span>
      <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-2 font-semibold">
        {label}
      </span>
      <div className="flex items-center gap-2 mt-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
          source === 'Presage SmartSpectra' ? 'bg-teal-500/20 text-teal-300' : 'bg-blue-500/20 text-blue-300'
        }`}>
          {source}
        </span>
        <span className={`w-2 h-2 rounded-full ${dotColor}`} title={`${confidence} confidence`} />
      </div>
    </div>
  );
}

export default function VitalsPanel({ vitals }) {
  if (!vitals) return null;

  const hr = vitals.heart_rate;
  const br = vitals.breathing_rate;
  const con = vitals.consciousness;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <VitalCard
        label="Heart Rate"
        value={hr?.estimate ?? '—'}
        status={hr?.status}
        source={hr?.source || 'AI Estimated'}
        confidence={hr?.confidence}
        animate={hr?.status !== 'unknown'}
      />
      <VitalCard
        label="Breathing Rate"
        value={br?.estimate ?? '—'}
        status={br?.status}
        source={br?.source || 'AI Estimated'}
        confidence={br?.confidence}
      />
      <VitalCard
        label="Consciousness"
        value={con?.level || '—'}
        status={con?.level === 'Alert' ? 'normal' : con?.level === 'Unresponsive' ? 'critical' : 'elevated'}
        source="AI Estimated"
        confidence={con?.confidence}
      />
    </div>
  );
}
