export const extractFrames = async (videoUrl, numFrames = 6) => {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.src = videoUrl;
  video.muted = true;
  video.preload = 'auto';

  await Promise.race([
    new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = () => reject(new Error('Failed to load video for frame extraction'));
      video.load();
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Video metadata load timed out')), 15000)),
  ]);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const scale = Math.min(1, 1280 / video.videoWidth);
  canvas.width = video.videoWidth * scale;
  canvas.height = video.videoHeight * scale;

  const duration = video.duration;
  const interval = duration / numFrames;
  const frames = [];

  for (let i = 0; i < numFrames; i++) {
    video.currentTime = i * interval;
    await Promise.race([
      new Promise(r => video.addEventListener('seeked', r, { once: true })),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Video seek timed out')), 5000)),
    ]);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL('image/jpeg', 0.7));
  }

  return frames;
};
