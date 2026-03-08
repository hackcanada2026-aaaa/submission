import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mic, FileText, Handshake } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-red-950/40 via-[var(--bg-primary)] to-emerald-950/40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto"
      >
        <div className="mb-8">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-30 h-30 mx-auto mb-6 rounded-full bg-red-600/20 flex items-center justify-center overflow-visible"
          >
            <img src={logo} alt="Bystander" className="w-28 h-28 object-contain" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2 tracking-tight">bystander</h1>
          <p className="text-[var(--text-secondary)] text-lg">AI emergency handoff in seconds 🚀</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/capture')}
          className="w-full max-w-xs mx-auto block py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg rounded-2xl transition-colors cursor-pointer"
        >
          Start Emergency Analysis
        </motion.button>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm text-[var(--text-secondary)]">
          <div className="flex flex-col items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--accent-teal)]" />
            <span>Scene Analysis</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Mic className="w-5 h-5 text-[var(--accent-blue)]" />
            <span>Voice Coach</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--accent-amber)]" />
            <span>ER Report</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Handshake className="w-5 h-5 text-[var(--accent-teal)]" />
            <span>Professional Handoff</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
