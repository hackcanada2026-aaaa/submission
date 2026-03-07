import { useState, useRef, useCallback, useEffect } from 'react';

export function useVideoCapture() {
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(s);
      setError(null);
      return s;
    } catch {
      setError('Camera access denied. Please allow camera permissions.');
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [stream]);

  const startRecording = useCallback(() => {
    if (!stream) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
      setRecording(false);
      setCountdown(null);
    };

    mr.start();
    setRecording(true);
    setCountdown(8);

    let count = 8;
    timerRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timerRef.current);
        if (mr.state === 'recording') mr.stop();
      }
    }, 1000);
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleFileUpload = useCallback((file) => {
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum 50MB.');
      return;
    }
    setVideoBlob(file);
    setVideoUrl(URL.createObjectURL(file));
  }, []);

  const resetCapture = useCallback(() => {
    setVideoBlob(null);
    setVideoUrl(null);
    setCountdown(null);
  }, []);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stream]);

  return {
    stream, recording, countdown, videoBlob, videoUrl, error,
    startCamera, stopCamera, startRecording, stopRecording, handleFileUpload, resetCapture,
  };
}
