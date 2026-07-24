import { useState, type FormEvent } from 'react';
import { User, Mail, Home, Save, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { initials, fmtDate } from '../lib/utils';

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [farmName, setFarmName] = useState(profile?.farm_name ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const { error } = updateProfile({
      full_name: fullName.trim() || null,
      farm_name: farmName.trim() || null,
    });
    if (error) setError(error);
    else setMessage('Profile updated successfully.');
  }

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Farmer';

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <PageHeader title="Profile" subtitle="Your account and farm details." icon={User} />

      {/* Profile card */}
      <section className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="grid place-items-center w-20 h-20 rounded-3xl bg-gradient-to-br from-forest-500 to-forest-700 text-white text-2xl font-bold shadow-glow shrink-0">
            {initials(displayName)}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-forest-900 dark:text-forest-50">{displayName}</h2>
            {profile?.farm_name && <p className="text-forest-600 dark:text-forest-300">{profile.farm_name}</p>}
            <p className="text-sm text-forest-500 dark:text-forest-400 mt-1">{user?.email}</p>
            <p className="text-xs text-forest-400 dark:text-forest-500 mt-1">Member since {fmtDate(user?.createdAt ?? profile?.created_at ?? null)}</p>
          </div>
        </div>
      </section>

      {/* Edit form */}
      <section className="glass-card p-6">
        <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 mb-4">Edit profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name">
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400" />
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="input-field pl-11" />
            </div>
          </Field>
          <Field label="Farm name">
            <div className="relative">
              <Home size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400" />
              <input value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="Your farm" className="input-field pl-11" />
            </div>
          </Field>
          <Field label="Email (cannot be changed)">
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400" />
              <input value={user?.email ?? ''} disabled className="input-field pl-11 opacity-60 cursor-not-allowed" />
            </div>
          </Field>

          {message && <div className="rounded-2xl bg-forest-100 border border-forest-200 px-4 py-3 text-sm text-forest-700 dark:bg-forest-800/50 dark:border-forest-700 dark:text-forest-200">{message}</div>}
          {error && <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200">{error}</div>}

          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              <Save size={18} /> Save changes
            </button>
          </div>
        </form>
      </section>

      {/* Account actions */}
      <section className="glass-card p-6">
        <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 mb-4 flex items-center gap-2">
          <Shield size={20} className="text-forest-600 dark:text-forest-300" /> Account
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate('/settings')} className="btn-secondary flex-1">Change password & settings</button>
          <button onClick={handleSignOut} className="btn-secondary flex-1 !text-rose-600 !border-rose-200 hover:!bg-rose-50 dark:!border-rose-900/50 dark:hover:!bg-rose-900/30">
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </section>
    </div>
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
