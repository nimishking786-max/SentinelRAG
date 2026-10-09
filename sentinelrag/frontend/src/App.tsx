import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { ChatPage } from './pages/ChatPage';
import { DocumentManagement } from './pages/DocumentManagement';
import { SecurityDashboard } from './pages/SecurityDashboard';
import { Shield } from 'lucide-react';

const Footer = () => (
  <footer className="mt-16 border-t border-slate-200/80 dark:border-vault-border/80 py-8 px-4 text-xs text-slate-500 dark:text-slate-400">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
        <span className="font-bold text-slate-700 dark:text-slate-300">SentinelRAG</span>
        <span>— Zero-Trust Permission-Aware Retrieval-Augmented Generation</span>
      </div>

      <div className="flex items-center gap-6">
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Vault Security: Online
        </span>
        <span className="text-slate-400">v1.0.0 (Hackathon Edition)</span>
      </div>
    </div>
  </footer>
);

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[#f4f7fb] dark:bg-vault-bg text-slate-800 dark:text-slate-100 transition-colors">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/documents" element={<DocumentManagement />} />
            <Route path="/security" element={<SecurityDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
};

export default App;
