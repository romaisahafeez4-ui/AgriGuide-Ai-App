import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Sprout, LayoutDashboard, Wheat, Wallet, CalendarClock, Bot, Leaf,
  User, Settings, LogOut, Menu, X, Moon, Sun, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { initials } from '../../lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/crops', label: 'Crops', icon: Wheat },
  { to: '/expenses', label: 'Expenses', icon: Wallet },
  { to: '/calendar', label: 'Calendar', icon: CalendarClock },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/plant-health', label: 'Plant Health', icon: Leaf },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const { profile, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Farmer';
  const farmName = profile?.farm_name || 'My Farm';

  async function handleSignOut() {
    signOut();
    navigate('/login');
  }

  const currentLabel = NAV.find((n) => location.pathname.startsWith(n.to))?.label ?? 'AgriGuide AI';

  return (
    <div className="min-h-screen bg-forest-50 dark:bg-forest-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-forest-100 dark:border-forest-800/60 bg-white/70 dark:bg-forest-900/50 backdrop-blur-xl z-30">
        <SidebarContent
          displayName={displayName}
          farmName={farmName}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 flex flex-col bg-white dark:bg-forest-900 shadow-2xl animate-slide-in">
            <SidebarContent
              displayName={displayName}
              farmName={farmName}
              onSignOut={handleSignOut}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-16 border-b border-forest-100 dark:border-forest-800/60 bg-white/70 dark:bg-forest-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden grid place-items-center w-10 h-10 rounded-xl text-forest-700 hover:bg-forest-100 dark:text-forest-200 dark:hover:bg-forest-800/60"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="grid place-items-center w-10 h-10 rounded-xl text-forest-700 hover:bg-forest-100 dark:text-forest-200 dark:hover:bg-forest-800/60 transition"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 rounded-2xl pl-1 pr-3 py-1 hover:bg-forest-100 dark:hover:bg-forest-800/60 transition"
            >
              <div className="grid place-items-center w-9 h-9 rounded-xl bg-forest-600 text-white text-sm font-semibold">
                {initials(displayName)}
              </div>
              <span className="hidden sm:block text-sm font-medium text-forest-800 dark:text-forest-100 max-w-[120px] truncate">
                {displayName}
              </span>
            </button>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  displayName,
  farmName,
  onSignOut,
  onNavigate,
}: {
  displayName: string;
  farmName: string;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-5 h-16 border-b border-forest-100 dark:border-forest-800/60">
        <div className="flex items-center gap-2.5">
          <div className="grid place-items-center w-10 h-10 rounded-2xl bg-forest-600 text-white shadow-glow">
            <Sprout size={22} />
          </div>
          <div className="leading-tight">
            <p className="font-display font-bold text-forest-900 dark:text-forest-50">AgriGuide AI</p>
            <p className="text-[11px] text-forest-500 dark:text-forest-400">Smart farming</p>
          </div>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} className="lg:hidden p-2 text-forest-500 hover:bg-forest-100 dark:hover:bg-forest-800/60 rounded-xl">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-forest-600 text-white shadow-soft'
                  : 'text-forest-700 hover:bg-forest-100 dark:text-forest-200 dark:hover:bg-forest-800/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-white' : 'text-forest-500 group-hover:text-forest-700 dark:text-forest-400'} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={16} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-forest-100 dark:border-forest-800/60 p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="grid place-items-center w-10 h-10 rounded-2xl bg-forest-100 text-forest-700 dark:bg-forest-800/60 dark:text-forest-200 text-sm font-semibold">
            {initials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-forest-900 dark:text-forest-50 truncate">{displayName}</p>
            <p className="text-xs text-forest-500 dark:text-forest-400 truncate">{farmName}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
        >
          <LogOut size={20} />
          Sign out
        </button>
      </div>
    </>
  );
}
