import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Capture from './components/Capture';
import Analysis from './components/Analysis';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}
