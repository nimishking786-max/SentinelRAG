import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'HR_MANAGER' | 'FINANCE_MANAGER' | 'EMPLOYEE';
  department: string;
  avatar_url?: string;
  access_token: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  availableUsers: UserProfile[];
  switchUser: (user: UserProfile) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  loading: boolean;
}

const defaultProfiles: UserProfile[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "admin@sentinel.com",
    full_name: "Alex Vance (Chief Security Officer)",
    role: "ADMIN",
    department: "ADMIN",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    access_token: ""
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "finance@sentinel.com",
    full_name: "Marcus Chen (VP of Finance)",
    role: "FINANCE_MANAGER",
    department: "FINANCE",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    access_token: ""
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "hr@sentinel.com",
    full_name: "Sarah Jenkins (Head of HR)",
    role: "HR_MANAGER",
    department: "HR",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    access_token: ""
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    email: "employee@sentinel.com",
    full_name: "Rahul Sharma (Software Engineer)",
    role: "EMPLOYEE",
    department: "GENERAL",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    access_token: ""
  }
];

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  availableUsers: [],
  switchUser: () => {},
  darkMode: false,
  toggleDarkMode: () => {},
  loading: true
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>(defaultProfiles);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sentinel_theme') === 'dark' || true; // default to sleek dark mode
  });
  const [loading, setLoading] = useState(true);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sentinel_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sentinel_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Load demo users from backend API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/auth/demo-users');
        if (res.data && res.data.length > 0) {
          setAvailableUsers(res.data);
          const savedUserId = localStorage.getItem('sentinel_user_id');
          const matched = res.data.find((u: UserProfile) => u.id === savedUserId);
          const initial = matched || res.data[1]; // default to Marcus Chen (FINANCE_MANAGER) for demo
          setCurrentUser(initial);
          localStorage.setItem('token', initial.access_token);
          localStorage.setItem('sentinel_user_id', initial.id);
        } else {
          setCurrentUser(defaultProfiles[1]);
        }
      } catch (err) {
        console.warn("Could not load /auth/demo-users, using local defaults:", err);
        setCurrentUser(defaultProfiles[1]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const switchUser = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.access_token) {
      localStorage.setItem('token', user.access_token);
    }
    localStorage.setItem('sentinel_user_id', user.id);
  };

  return (
    <AuthContext.Provider value={{ currentUser, availableUsers, switchUser, darkMode, toggleDarkMode, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
