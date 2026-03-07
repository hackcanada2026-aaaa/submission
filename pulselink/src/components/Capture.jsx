import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Upload } from 'lucide-react';
import { useVideoCapture } from '../hooks/useVideoCapture';
import { useTriage } from '../context/TriageContext';

export default function Capture() {
  const navigate = useNavigate();
  const { setVideoBlob } = useTriage();
  const {
    stream, recording, countdown, videoBlob, videoUrl, error,
    startCamera, stopCamera, startRecording, stopRecording, handleFileUpload, resetCapture,
  } = useVideoCapture();
  const previewRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Capture Scene</h2>
      </div>

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
          {recording ? 'Recording... tap to stop' : 'Tap to record (5s)'}
        </p>
        <div className="w-full border-t border-[var(--border)] pt-4 mt-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 px-4 border border-[var(--border)] rounded-xl text-[var(--text-secondary)] flex items-center justify-center gap-2 cursor-pointer hover:border-[var(--text-secondary)] transition-colors"
          >
            <Upload className="w-4 h-4" /> Upload video file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".mp4,.webm,.mov"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
          />
        </div>
      </div>
    </div>
  );
}
