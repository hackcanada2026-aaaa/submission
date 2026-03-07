import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Copy } from 'lucide-react';
import { useTriage } from '../context/TriageContext';

function buildPlainText(triageData, cloudinaryData, checkedSteps, chatMessages) {
  const t = triageData;
  const lines = [
    'PULSELINK EMERGENCY REPORT',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    `TRIAGE: ${t.diagnosis?.triage_category} — Severity ${t.diagnosis?.severity_score}/10`,
    `SUMMARY: ${t.summary}`,
    '',
    'VITALS:',
    `  Heart Rate: ${t.vitals?.heart_rate?.estimate} (${t.vitals?.heart_rate?.source}, ${t.vitals?.heart_rate?.confidence} confidence)`,
    `  Breathing Rate: ${t.vitals?.breathing_rate?.estimate} (${t.vitals?.breathing_rate?.source}, ${t.vitals?.breathing_rate?.confidence} confidence)`,
    `  Consciousness: ${t.vitals?.consciousness?.level} (${t.vitals?.consciousness?.confidence} confidence)`,
    '',
    'INJURIES:',
    ...(t.visual_analysis?.injuries_detected?.map(
      inj => `  - ${inj.type} on ${inj.location} (${inj.severity}): ${inj.details}`
    ) || ['  None detected']),
    '',
    `BLEEDING: ${t.visual_analysis?.bleeding?.detected ? `${t.visual_analysis.bleeding.severity} — ${t.visual_analysis.bleeding.location}` : 'None detected'}`,
    '',
    'RISK FLAGS:',
    ...(t.diagnosis?.risk_flags?.map(f => `  - ${f}`) || ['  None']),
    '',
    'FIRST AID STEPS:',
    ...(t.first_aid?.immediate_actions?.map(
      (s, i) => `  ${checkedSteps[i] ? '[X]' : '[ ]'} ${i + 1}. ${s}`
    ) || []),
    '',
    `CALL 911: ${t.first_aid?.call_911 ? 'YES — ' + t.first_aid.call_911_reason : 'Not required'}`,
    '',
    cloudinaryData ? `VIDEO: ${cloudinaryData.secure_url}` : '',
  ];

  if (chatMessages?.length) {
    lines.push('', 'AI CHAT TRANSCRIPT:');
    chatMessages.forEach(m => {
      lines.push(`  ${m.role === 'user' ? 'YOU' : 'AI'}: ${m.text}`);
    });
  }

  return lines.join('\n');
}

export default function IncidentReport({ open, onClose, chatMessages }) {
  const { triageData, cloudinaryData, checkedSteps } = useTriage();

  if (!triageData) return null;

  const t = triageData;

  const handlePrint = () => window.print();
  const handleCopy = () => {
    navigator.clipboard.writeText(buildPlainText(t, cloudinaryData, checkedSteps, chatMessages));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
        >
          <div className="min-h-screen py-8 px-4 flex justify-center">
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white text-gray-900 rounded-2xl max-w-2xl w-full p-8 relative"
            >
              <div className="no-print flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg text-sm cursor-pointer">
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg text-sm cursor-pointer">
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                </div>
                <button onClick={onClose} className="p-2 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h1 className="text-2xl font-bold mb-1">PulseLink Emergency Report</h1>
              <p className="text-sm text-gray-500 mb-6">{new Date().toLocaleString()}</p>

              <div className="space-y-6">
                <section>
                  <h2 className="text-lg font-semibold border-b pb-1 mb-2">Triage Assessment</h2>
                  <p className="font-medium">{t.diagnosis?.triage_category} — Severity {t.diagnosis?.severity_score}/10</p>
                  <p className="text-sm text-gray-600 mt-1">{t.summary}</p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold border-b pb-1 mb-2">Vitals</h2>
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500"><th className="pb-1">Vital</th><th>Value</th><th>Source</th><th>Confidence</th></tr></thead>
                    <tbody>
                      <tr><td className="py-1">Heart Rate</td><td>{t.vitals?.heart_rate?.estimate}</td><td>{t.vitals?.heart_rate?.source}</td><td>{t.vitals?.heart_rate?.confidence}</td></tr>
                      <tr><td className="py-1">Breathing Rate</td><td>{t.vitals?.breathing_rate?.estimate}</td><td>{t.vitals?.breathing_rate?.source}</td><td>{t.vitals?.breathing_rate?.confidence}</td></tr>
                      <tr><td className="py-1">Consciousness</td><td>{t.vitals?.consciousness?.level}</td><td>AI Estimated</td><td>{t.vitals?.consciousness?.confidence}</td></tr>
                    </tbody>
                  </table>
                </section>

                {t.visual_analysis?.injuries_detected?.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold border-b pb-1 mb-2">Injuries</h2>
                    {t.visual_analysis.injuries_detected.map((inj, i) => (
                      <p key={i} className="text-sm py-0.5">
                        <span className="font-medium capitalize">{inj.type}</span> on {inj.location} ({inj.severity}) — {inj.details}
                      </p>
                    ))}
                  </section>
                )}

                {t.diagnosis?.risk_flags?.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold border-b pb-1 mb-2">Risk Flags</h2>
                    <ul className="list-disc list-inside text-sm">
                      {t.diagnosis.risk_flags.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </section>
                )}

                <section>
                  <h2 className="text-lg font-semibold border-b pb-1 mb-2">First Aid</h2>
                  {t.first_aid?.immediate_actions?.map((step, i) => (
                    <p key={i} className="text-sm py-0.5">
                      <span className="font-mono">{checkedSteps[i] ? '☑' : '☐'}</span> {i + 1}. {step}
                    </p>
                  ))}
                  {t.first_aid?.call_911 && (
                    <p className="text-sm font-semibold text-red-600 mt-2">Call 911: {t.first_aid.call_911_reason}</p>
                  )}
                </section>

                {cloudinaryData?.secure_url && (
                  <section>
                    <h2 className="text-lg font-semibold border-b pb-1 mb-2">Video Reference</h2>
                    <p className="text-sm break-all text-blue-600">{cloudinaryData.secure_url}</p>
                  </section>
                )}

                {chatMessages?.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold border-b pb-1 mb-2">AI Chat Transcript</h2>
                    {chatMessages.map((m, i) => (
                      <p key={i} className="text-sm py-0.5">
                        <span className="font-semibold">{m.role === 'user' ? 'You' : 'AI'}:</span> {m.text}
                      </p>
                    ))}
                  </section>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
