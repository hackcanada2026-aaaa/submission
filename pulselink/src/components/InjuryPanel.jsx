import { Droplets } from 'lucide-react';

const SEVERITY_BADGE = {
  minor: 'bg-emerald-500/20 text-emerald-300',
  moderate: 'bg-amber-500/20 text-amber-300',
  severe: 'bg-red-500/20 text-red-300',
  critical: 'bg-red-600/30 text-red-400',
};

export default function InjuryPanel({ visualAnalysis }) {
  if (!visualAnalysis) return null;

  const { scene_description, injuries_detected, bleeding, body_position } = visualAnalysis;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Visual Analysis
      </h3>

      {scene_description && (
        <p className="text-sm text-[var(--text-primary)]">{scene_description}</p>
      )}

      {injuries_detected?.length > 0 && (
        <div className="space-y-2">
          {injuries_detected.map((inj, i) => (
            <div key={i} className="flex items-start gap-3 bg-[var(--bg-primary)] rounded-xl p-3">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_BADGE[inj.severity] || SEVERITY_BADGE.moderate}`}>
                {inj.severity}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">{inj.type} — {inj.location}</p>
                {inj.details && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{inj.details}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {bleeding?.detected && (
        <div className="flex items-center gap-2 text-sm">
          <Droplets className="w-4 h-4 text-red-400" />
          <span className="text-red-300">Bleeding: {bleeding.severity} — {bleeding.location}</span>
        </div>
      )}

      {body_position && (
        <p className="text-xs text-[var(--text-secondary)]">Position: {body_position}</p>
      )}
    </div>
  );
}
