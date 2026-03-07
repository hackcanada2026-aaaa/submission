import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Upload, Film } from 'lucide-react';
import { useVideoCapture } from '../hooks/useVideoCapture';
import { useTriage } from '../context/TriageContext';

export default function Capture() {
  const navigate = useNavigate();
  const { setVideoBlob } = useTriage();
  const {
    stream, recording, countdown, videoBlob, error,
    startCamera, stopCamera, startRecording, stopRecording, handleFileUpload,
  } = useVideoCapture();
  const previewRef = useRef(null);
  const fileRef = useRef(null);
  const [mode, setMode] = useState('record'); // 'record' or 'upload'
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (mode === 'record') {
      startCamera();
      return () => stopCamera();
    } else {
      stopCamera();
    }
  }, [mode]);

  useEffect(() => {
    if (previewRef.current && stream && !videoBlob) {
      previewRef.current.srcObject = stream;
    }
  }, [stream, videoBlob]);

  useEffect(() => {
    if (videoBlob) {
      setVideoBlob(videoBlob);
      navigate('/analysis');
    }
  }, [videoBlob]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) handleFileUpload(file);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Capture Scene</h2>
      </div>

      {/* Mode toggle */}
      <div className="px-4 pb-3">
        <div className="flex bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 gap-1">
          <button
            onClick={() => setMode('record')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              mode === 'record'
                ? 'bg-red-500 text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Camera className="w-4 h-4" /> Live Record
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              mode === 'upload'
                ? 'bg-red-500 text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Upload className="w-4 h-4" /> Upload Video
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        /* Upload mode */
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`w-full max-w-md aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
              dragOver
                ? 'border-red-500 bg-red-500/10'
                : 'border-[var(--border)] hover:border-[var(--text-secondary)] bg-[var(--bg-card)]'
            }`}
          >
            <Film className="w-12 h-12 text-[var(--text-secondary)]" />
            <div className="text-center">
              <p className="text-[var(--text-primary)] font-medium">
                Tap to select a video
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                or drag and drop here
              </p>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              MP4, WebM, MOV — max 50MB
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
          />
          {error && (
            <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
          )}
          <p className="text-xs text-[var(--text-secondary)] mt-6 text-center max-w-xs">
            Upload a video showing the scene. For best vitals results, ensure a person's face is visible and steady.
          </p>
        </div>
      ) : (
        /* Record mode */
        <>
          <div className="flex-1 relative bg-black min-h-[60vh]">
            {error && (
              <p className="absolute inset-0 flex items-center justify-center text-red-400 text-center px-4">{error}</p>
            )}
            <video
              ref={previewRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: stream ? 'block' : 'none' }}
            />
            {!stream && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[var(--text-secondary)] text-sm">Starting camera...</p>
              </div>
            )}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-8xl font-bold opacity-80 font-mono">
                  {countdown}
                </span>
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={recording ? stopRecording : startRecording}
              disabled={!stream}
              className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center cursor-pointer ${
                recording ? 'bg-red-600' : 'bg-red-500'
              } disabled:opacity-40`}
            >
              {recording ? (
                <div className="w-6 h-6 bg-white rounded-sm" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </motion.button>
            <p className="text-sm text-[var(--text-secondary)]">
              {recording ? 'Recording... tap to stop' : 'Tap to record (8s)'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
