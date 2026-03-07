export const extractFrames = async (videoUrl, numFrames = 10) => {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.src = videoUrl;
  video.muted = true;

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = reject;
    video.load();
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const scale = Math.min(1, 1280 / video.videoWidth);
  canvas.width = video.videoWidth * scale;
  canvas.height = video.videoHeight * scale;

  const interval = video.duration / numFrames;
  const frames = [];

  for (let i = 0; i < numFrames; i++) {
    video.currentTime = i * interval;
    await new Promise(r => video.addEventListener('seeked', r, { once: true }));
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL('image/jpeg', 0.7));
  }

  return frames;
};
