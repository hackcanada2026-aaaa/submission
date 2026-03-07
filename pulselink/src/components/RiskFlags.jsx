import { AlertTriangle } from 'lucide-react';

export default function RiskFlags({ flags }) {
  if (!flags?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((flag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 text-red-300 rounded-full text-sm font-medium"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {flag}
        </span>
      ))}
    </div>
  );
}
