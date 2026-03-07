let currentAudio = null;

export const stopAudio = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
};

export const speakText = async (text) => {
  stopAudio();
  const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.75, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) throw new Error('ElevenLabs TTS failed');
  const blob = await res.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  currentAudio = audio;

  return new Promise((resolve) => {
    audio.onended = () => { currentAudio = null; resolve(); };
    audio.play();
  });
};

export const speakSequential = async (texts, onStepChange) => {
  for (let i = 0; i < texts.length; i++) {
    onStepChange?.(i);
    await speakText(texts[i]);
  }
  onStepChange?.(-1);
};
