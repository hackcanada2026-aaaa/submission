export const fetchPresageVitals = async (cloudinarySecureUrl) => {
  const res = await fetch('/api/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl: cloudinarySecureUrl }),
  });
  if (!res.ok) throw new Error('Presage vitals request failed');
  return res.json();
};
