const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const notifyFirstAiders = async (triageData) => {
  const score = triageData.diagnosis?.severity_score;
  if (score < 8) return { sent: false, reason: 'Below threshold' };

  try {
    const res = await fetch(`${API_URL}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        severityScore: score,
        summary: triageData.summary,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Notify failed:', err.message);
    return { sent: false, reason: err.message };
  }
};
