import { useState, type FormEvent } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PageHeader } from '../components/PageHeader';

export default function SettingsPage() {
  const { user, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    const { error } = changePassword(newPassword);
    if (error) { setError(error); return; }
    setMessage('Password changed successfully.');
    setNewPassword('');
    setConfirm('');
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your preferences and security." icon={SettingsIcon} />

      {/* Appearance */}
      <section className="glass-card p-6">
        <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 mb-1">Appearance</h2>
        <p className="text-sm text-forest-600 dark:text-forest-300 mb-4">Choose how AgriGuide AI looks to you.</p>
        <div className="grid grid-cols-2 gap-3">
          <ThemeOption
            active={theme === 'light'}
            onClick={() => setTheme('light')}
            icon={<Sun size={20} />}
            label="Light mode"
          />
          <ThemeOption
            active={theme === 'dark'}
            onClick={() => setTheme('dark')}
            icon={<Moon size={20} />}
            label="Dark mode"
          />
        </div>
      </section>

      {/* Change password */}
      <section className="glass-card p-6">
        <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 mb-1 flex items-center gap-2">
          <Lock size={20} className="text-forest-600 dark:text-forest-300" /> Change password
        </h2>
        <p className="text-sm text-forest-600 dark:text-forest-300 mb-4">For {user?.email}</p>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Field label="New password">
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-field pl-11 pr-11"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-forest-400 hover:text-forest-600" tabIndex={-1}>
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <Field label="Confirm new password">
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
                className="input-field pl-11"
                autoComplete="new-password"
              />
            </div>
          </Field>

          {message && <div className="rounded-2xl bg-forest-100 border border-forest-200 px-4 py-3 text-sm text-forest-700 dark:bg-forest-800/50 dark:border-forest-700 dark:text-forest-200 flex items-center gap-2"><Check size={16} /> {message}</div>}
          {error && <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200">{error}</div>}

          <div className="flex justify-end">
            <button type="submit" className="btn-primary">Update password</button>
          </div>
        </form>
      </section>

      {/* About */}
      <section className="glass-card p-6">
        <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 mb-2">About AgriGuide AI</h2>
        <p className="text-sm text-forest-600 dark:text-forest-300">
          AgriGuide AI helps small farmers manage crops, expenses, tasks, and get AI-powered farming guidance. Your account and data are stored locally in your browser — no server required.
        </p>
      </section>
    </div>
  );
}

function ThemeOption({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl p-4 border-2 transition ${
        active
          ? 'border-forest-500 bg-forest-50 dark:bg-forest-800/40'
          : 'border-forest-100 dark:border-forest-800/60 bg-white/50 dark:bg-forest-900/30 hover:border-forest-300'
      }`}
    >
      <span className={`grid place-items-center w-10 h-10 rounded-xl ${active ? 'bg-forest-600 text-white' : 'bg-forest-100 text-forest-700 dark:bg-forest-800/60 dark:text-forest-200'}`}>{icon}</span>
      <span className="font-medium text-forest-800 dark:text-forest-100">{label}</span>
      {active && <Check size={18} className="ml-auto text-forest-600 dark:text-forest-300" />}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-forest-700 dark:text-forest-200 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
