import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
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
} from 'lucide-react';

export const Navbar = () => {
  const { currentUser, availableUsers, switchUser, darkMode, toggleDarkMode } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Overview', icon: Zap },
    { to: '/chat', label: 'Secure Chat', icon: MessageSquare },
    { to: '/documents', label: 'Vault', icon: FolderLock },
    { to: '/security', label: 'Security Center', icon: ShieldAlert },
  ];

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'FINANCE_MANAGER':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'HR_MANAGER':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    }
  };

  return (
    <header className="sticky top-0 z-50 px-4 py-3 max-w-7xl mx-auto w-full">
      <nav className="glass-panel px-5 py-3 flex items-center justify-between gap-4 border border-white/40 dark:border-vault-border/80 shadow-lg backdrop-blur-xl">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              SentinelRAG
            </div>
            <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-500 dark:text-slate-400">
              Zero-Trust AI Vault
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100/70 dark:bg-vault-card/70 p-1.5 rounded-2xl border border-slate-200/50 dark:border-vault-border/60">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-vault-surface text-indigo-600 dark:text-cyan-400 shadow-sm border border-slate-200/40 dark:border-vault-border'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
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
              className="flex items-center gap-2.5 bg-white dark:bg-vault-card px-3.5 py-1.5 rounded-2xl border border-slate-200/70 dark:border-vault-border shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-inner">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {currentUser?.full_name.split(' ')[0]}
                </div>
                <div className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${getRoleBadgeStyle(currentUser?.role)}`}>
                  {currentUser?.role || 'SIMULATOR'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Persona Dropdown Menu */}
            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-vault-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-vault-border p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-vault-border mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Security Persona
                  </span>
                  <p className="text-[11px] text-slate-500">Test how permissions dynamically reshape retrieval</p>
                </div>

                <div className="space-y-1">
                  {availableUsers.map((user) => {
                    const isSelected = currentUser?.id === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => switchUser(user)}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
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
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(user.role)}`}>
                              {user.role}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">{user.department}</span>
                          </div>
                        </div>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-cyan-400 shrink-0"></div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-2xl bg-white dark:bg-vault-card border border-slate-200/70 dark:border-vault-border text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors shadow-sm"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-vault-card text-slate-700 dark:text-slate-300"
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
    </header>
  );
};
