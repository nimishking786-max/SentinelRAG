import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  avatar_url?: string;
  access_token: string;
  must_change_password?: boolean;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  availableUsers: UserProfile[];
  darkMode: boolean;
  toggleDarkMode: () => void;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, department: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
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
  darkMode: false,
  toggleDarkMode: () => {},
  loading: true
  , login: async () => {}, register: async () => {}, logout: () => {}, changePassword: async () => {}, updateAvatar: async () => {}
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
        }

        const token = localStorage.getItem('token');
        if (token) {
          try {
            const me = await api.get('/auth/me');
            setCurrentUser({ ...me.data, access_token: token });
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('sentinel_user_id');
          }
        }
      } catch (err) {
        console.warn("Could not load /auth/demo-users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const user = { ...res.data.user, access_token: res.data.access_token } as UserProfile;
    setCurrentUser(user);
    localStorage.setItem('token', user.access_token);
    localStorage.setItem('sentinel_user_id', user.id);
  };

  const register = async (fullName: string, email: string, password: string, department: string) => {
    const res = await api.post('/auth/register', {
      full_name: fullName,
      email,
      password,
      department,
    });
    const user = { ...res.data.user, access_token: res.data.access_token } as UserProfile;
    setCurrentUser(user);
    setAvailableUsers((current) => [...current, user]);
    localStorage.setItem('token', user.access_token);
    localStorage.setItem('sentinel_user_id', user.id);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
    setCurrentUser((current) => current ? { ...current, must_change_password: false } : current);
  };

  const updateAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/auth/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setCurrentUser((current) => current ? { ...current, avatar_url: response.data.avatar_url } : current);
    setAvailableUsers((users) => users.map((user) => (
      user.id === currentUser?.id ? { ...user, avatar_url: response.data.avatar_url } : user
    )));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('sentinel_user_id');
  };

  return (
    <AuthContext.Provider value={{ currentUser, availableUsers, darkMode, toggleDarkMode, loading, login, register, logout, changePassword, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
