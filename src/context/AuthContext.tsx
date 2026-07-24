import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { db } from '../lib/db';
import type { Profile } from '../lib/types';

export interface AppUser {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthContextValue {
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, farmName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  refreshProfile: () => void;
  updateProfile: (patch: Partial<Profile>) => { error: string | null };
  changePassword: (newPassword: string) => { error: string | null };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = db.getSession();
    if (sessionId) {
      const found = db.getUsers().find((u) => u.id === sessionId);
      if (found) {
        setUser({ id: found.id, email: found.email, createdAt: found.createdAt });
        setProfile(db.getProfile(found.id));
      } else {
        db.clearSession();
      }
    }
    setLoading(false);
  }, []);

  const signUp: AuthContextValue['signUp'] = async (email, password, fullName, farmName) => {
    if (!email.trim() || !password) return { error: 'Email and password are required.' };
    if (password.length < 6) return { error: 'Password must be at least 6 characters.' };
    const { user: newUser, error } = db.registerUser(email.trim(), password);
    if (error || !newUser) return { error: error ?? 'Could not create account.' };
    if (fullName.trim() || farmName.trim()) {
      db.updateProfile(newUser.id, {
        full_name: fullName.trim() || null,
        farm_name: farmName.trim() || null,
      });
    }
    db.setSession(newUser.id);
    setUser({ id: newUser.id, email: newUser.email, createdAt: newUser.createdAt });
    setProfile(db.getProfile(newUser.id));
    db.logActivity(newUser.id, 'Account created');
    return { error: null };
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    if (!email.trim() || !password) return { error: 'Email and password are required.' };
    const { user: found, error } = db.verifyCredentials(email.trim(), password);
    if (error || !found) return { error: error ?? 'Sign in failed.' };
    db.setSession(found.id);
    setUser({ id: found.id, email: found.email, createdAt: found.createdAt });
    setProfile(db.getProfile(found.id));
    return { error: null };
  };

  const signOut = () => {
    db.clearSession();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = () => {
    if (user) setProfile(db.getProfile(user.id));
  };

  const updateProfile: AuthContextValue['updateProfile'] = (patch) => {
    if (!user) return { error: 'Not signed in.' };
    const updated = db.updateProfile(user.id, patch);
    setProfile(updated);
    return { error: null };
  };

  const changePassword: AuthContextValue['changePassword'] = (newPassword) => {
    if (!user) return { error: 'Not signed in.' };
    if (newPassword.length < 6) return { error: 'Password must be at least 6 characters.' };
    const res = db.changePassword(user.id, newPassword);
    return { error: res.error ?? null };
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile, updateProfile, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
