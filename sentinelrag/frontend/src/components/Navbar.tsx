import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemedSelect } from './ui/ThemedSelect';
import { 
  MessageSquare, 
  FolderLock, 
  ShieldAlert, 
  Sun, 
  Moon, 
  ChevronDown, 
  User, 
  Menu, 
  X,
  Zap
  , LogIn,   UserPlus, LogOut, Settings
} from 'lucide-react';

export const Navbar = () => {
  const { currentUser, availableUsers, darkMode, toggleDarkMode, login, register, logout } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '', department: 'GENERAL' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const navLinks = [
    { to: '/', label: 'Overview', icon: Zap },
    { to: '/chat', label: 'Secure Chat', icon: MessageSquare },
    { to: '/documents', label: 'Vault', icon: FolderLock },
    { to: '/security', label: 'Security Center', icon: ShieldAlert },
  ];

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'text-amber-200';
      case 'FINANCE_MANAGER':
        return 'text-sky-200';
      case 'HR_MANAGER':
        return 'text-emerald-200';
      default:
        return 'text-white/70';
    }
  };

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      if (authMode === 'login') {
        await login(authForm.email, authForm.password);
      } else {
        await register(authForm.fullName, authForm.email, authForm.password, authForm.department);
      }
      setAuthMode(null);
      setAuthForm({ fullName: '', email: '', password: '', department: 'GENERAL' });
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setAuthError(typeof detail === 'string' ? detail : 'Authentication failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  return (
    <header className={`${isLandingPage ? 'absolute' : 'relative'} inset-x-0 top-0 z-50 w-full px-5 py-5 lg:px-8`}>
      <nav className={`mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-1 py-2.5 lg:px-2 ${!isLandingPage ? 'glass-panel rounded-2xl px-4' : ''}`}>
        {/* Brand Logo */}
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-white/30 bg-slate-900 shadow-lg shadow-black/20 transition-transform group-hover:scale-105">
            <img
              src="/sentinel-icon.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className={`text-lg font-extrabold tracking-tight ${isLandingPage ? 'text-amber-100' : 'text-slate-900 dark:text-amber-100'}`}>
              SentinelRAG
            </div>
            <div className={`text-[10px] font-semibold uppercase tracking-wider ${isLandingPage ? 'text-white/55' : 'text-slate-500 dark:text-white/55'}`}>
              Zero-Trust AI Vault
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-5 md:flex">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-1 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? isLandingPage ? 'text-white' : 'text-slate-900 dark:text-white'
                    : isLandingPage ? 'text-white/55 hover:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-white/55 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Actions: Persona Switcher & Theme */}
        <div className="flex items-center gap-3">
          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-1 py-1.5 text-left transition-all hover:text-amber-100"
            >
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-amber-300 to-rose-500 text-xs font-bold text-white shadow-inner">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="hidden sm:block">
                <div className={`max-w-[120px] truncate text-xs font-bold ${isLandingPage ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {currentUser?.full_name.split(' ')[0]}
                </div>
                <div className={`text-[10px] font-bold ${getRoleBadgeStyle(currentUser?.role)}`}>
                  {currentUser?.role || 'SIMULATOR'}
                </div>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 ${isLandingPage ? 'text-white/60' : 'text-slate-500 dark:text-white/60'}`} />
            </button>

            {/* Persona Dropdown Menu */}
            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-vault-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-vault-border p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-vault-border mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Your Organization
                  </span>
                  <p className="text-[11px] text-slate-500">Peers are visible for context but cannot be selected.</p>
                </div>

                <div className="space-y-1">
                  {availableUsers.map((user) => {
                    const isSelected = currentUser?.id === user.id;
                    return (
                      <div
                        key={user.id}
                        aria-current={isSelected ? 'true' : undefined}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'text-slate-500 dark:text-slate-500 opacity-75'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300 dark:border-vault-border">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 m-auto mt-2 text-slate-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{user.full_name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-semibold ${getRoleBadgeStyle(user.role)}`}>
                              {user.role}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">{user.department}</span>
                          </div>
                        </div>
                        {isSelected ? (
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-cyan-400 shrink-0">You</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 shrink-0">Peer</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Link to="/profile" className="mt-2 flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 py-2 text-[11px] font-semibold hover:border-[#FF6A1A] hover:text-[#FF6A1A] dark:border-vault-border">
                  <Settings className="h-3.5 w-3.5" /> View profile
                </Link>
                {!currentUser && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-vault-border grid grid-cols-2 gap-2">
                    <button onClick={() => setAuthMode('login')} className="flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                      <LogIn className="w-3.5 h-3.5" /> Login
                    </button>
                    <button onClick={() => setAuthMode('register')} className="flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">
                      <UserPlus className="w-3.5 h-3.5" /> Register
                    </button>
                  </div>
                )}
                {currentUser && (
                  <button onClick={logout} className="mt-1 w-full flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle Theme"
            className={`p-2.5 transition ${isLandingPage ? 'text-amber-200 hover:text-amber-100' : 'text-amber-600 hover:text-amber-700 dark:text-amber-200 dark:hover:text-amber-100'}`}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 glass-panel p-4 flex flex-col gap-2 border border-slate-200 dark:border-vault-border animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
      {authMode && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={submitAuth} className="clay-card bg-white dark:bg-vault-surface w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{authMode === 'login' ? 'Sign in to SentinelRAG' : 'Create your account'}</h2>
              <button type="button" onClick={() => setAuthMode(null)} className="text-slate-400">✕</button>
            </div>
            {authError && <div className="rounded-xl bg-red-50 text-red-700 p-3 text-xs">{authError}</div>}
            {authMode === 'register' && (
              <input required placeholder="Full name" value={authForm.fullName} onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })} className="clay-input w-full" />
            )}
            <input required type="email" placeholder="Email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} className="clay-input w-full" />
            <input required minLength={8} type="password" placeholder="Password (minimum 8 characters)" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} className="clay-input w-full" />
            {authMode === 'register' && (
              <ThemedSelect
                value={authForm.department}
                onChange={(department) => setAuthForm({ ...authForm, department })}
                options={['GENERAL', 'HR', 'FINANCE', 'SALES', 'RESEARCH'].map((department) => ({ value: department, label: department }))}
                aria-label="Department"
              />
            )}
            <button disabled={authSubmitting} className="neubrutalist-btn-primary w-full">
              {authSubmitting ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}
            </button>
            <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-xs text-indigo-600">
              {authMode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}
            </button>
          </form>
        </div>
      )}
    </header>
  );
};
