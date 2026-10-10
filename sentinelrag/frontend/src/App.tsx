import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Routes, Route } from 'react-router-dom';
import gsap from 'gsap';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { ChatPage } from './pages/ChatPage';
import { DocumentManagement } from './pages/DocumentManagement';
import { SecurityDashboard } from './pages/SecurityDashboard';
import { Shield } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { BackgroundBeams } from './components/aceternity/BackgroundBeams';
import { SmoothScroll } from './components/SmoothScroll';
import { ProfilePage } from './pages/ProfilePage';
import { PasswordInput } from './components/ui/PasswordInput';

const AuthScreen = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.fullName, form.email, form.password);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f7fb] dark:bg-vault-bg">
      <form onSubmit={submit} className="shadcn-card bg-white dark:bg-vault-surface w-full max-w-md p-8 space-y-4">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-indigo-600 dark:text-cyan-400" />
          <h1 className="text-2xl font-extrabold mt-3">Welcome to SentinelRAG</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in or create an account to enter the secure vault.</p>
        </div>
        {error && <div className="rounded-xl bg-red-50 text-red-700 p-3 text-xs">{error}</div>}
        {mode === 'register' && (
          <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="shadcn-input w-full" />
        )}
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="shadcn-input w-full" />
        <PasswordInput
          required
          minLength={8}
          placeholder="Password (minimum 8 characters)"
          value={form.password}
          onChange={(password) => setForm({ ...form, password })}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
        <button disabled={submitting} className="shadcn-btn-primary w-full">{submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} className="w-full text-xs text-indigo-600">
          {mode === 'login' ? 'First time here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
};

const RequiredPasswordChange = () => {
  const { changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('Sentinel@123');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try { await changePassword(currentPassword, newPassword); }
    catch (err: any) { setError(err?.response?.data?.detail || 'Could not change password'); }
    finally { setSaving(false); }
  };
  return <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f7fb] dark:bg-vault-bg">
    <form onSubmit={submit} className="shadcn-card bg-white dark:bg-vault-surface w-full max-w-md p-8 space-y-4">
      <h1 className="text-xl font-bold">Change your initial password</h1>
      <p className="text-xs text-slate-500">Your administrator created this account. Choose a new password before continuing.</p>
      {error && <div className="rounded-xl bg-red-50 text-red-700 p-3 text-xs">{error}</div>}
      <input required type="password" placeholder="Initial password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="shadcn-input w-full" />
      <input required minLength={8} type="password" placeholder="New password (minimum 8 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="shadcn-input w-full" />
      <button disabled={saving} className="shadcn-btn-primary w-full">{saving ? 'Saving...' : 'Change password'}</button>
      <button type="button" onClick={logout} className="w-full text-xs text-red-600">Sign out</button>
    </form>
  </div>;
};

const Footer = () => (
  <footer className="app-footer mt-16 border-t border-slate-200/80 dark:border-vault-border/80 px-4 py-8 text-[0.75rem] text-slate-500 dark:text-slate-400 sm:px-8">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row sm:items-start">
      <div className="flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center leading-relaxed sm:justify-start sm:text-left">
        <Shield className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
        <span className="font-bold text-slate-700 dark:text-slate-300">SentinelRAG</span>
        <span>— Zero-Trust Permission-Aware Retrieval-Augmented Generation</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center sm:justify-end sm:text-right">
        <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Vault Security: Online
        </span>
        <span className="whitespace-nowrap text-slate-400 dark:text-slate-500">v1.0.0 (Hackathon Edition)</span>
      </div>
    </div>
  </footer>
);

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const percentRef = useRef<HTMLHeadingElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const progress = { value: 0 };
    const timeline = gsap.timeline({ onComplete });
    timeline.to(progress, {
      value: 100,
      duration: 2,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (percentRef.current) {
          percentRef.current.textContent = `${Math.round(progress.value)}%`;
        }
      },
    }, 0);
    timeline.fromTo(
      progressRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 2, ease: 'power2.inOut', transformOrigin: 'left center' },
      0,
    );

    return () => {
      timeline.kill();
    };
  }, [onComplete]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-xl">
        <h2 ref={percentRef} className="mb-5 font-mono text-4xl font-bold tracking-[-0.06em] text-white">
          0%
        </h2>
        <div className="h-px w-full overflow-hidden bg-white/20">
          <div ref={progressRef} className="h-full w-full origin-left bg-white" />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const { currentUser, loading } = useAuth();
  const [loaderComplete, setLoaderComplete] = useState(false);
  const finishLoader = useRef(() => setLoaderComplete(true)).current;
  if (loading || !loaderComplete) return <LoadingScreen onComplete={finishLoader} />;
  if (!currentUser) return <AuthScreen />;
  if ((currentUser as any).must_change_password) return <RequiredPasswordChange />;

  return (
      <div className="relative min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-[#070b14] dark:text-slate-100">
        <SmoothScroll />
        <BackgroundBeams />
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/documents" element={<DocumentManagement />} />
            <Route path="/security" element={<SecurityDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
  );
};

const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default RootApp;
