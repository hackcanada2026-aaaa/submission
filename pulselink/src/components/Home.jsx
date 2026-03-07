import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Shield, Mic, FileText } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto"
      >
        <div className="mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-600/20 flex items-center justify-center"
          >
            <Heart className="w-10 h-10 text-red-500" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2 tracking-tight">Bystander</h1>
          <p className="text-[var(--text-secondary)] text-lg">AI-powered triage in seconds</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/capture')}
          className="w-full max-w-xs mx-auto block py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg rounded-2xl transition-colors cursor-pointer"
        >
          Start Emergency Analysis
        </motion.button>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center text-sm text-[var(--text-secondary)]">
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
        </div>
      </motion.div>
    </div>
  );
}
