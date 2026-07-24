import { Outlet, Link } from 'react-router-dom';
import { Sprout, Leaf, TrendingUp, CalendarClock } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-forest-50 via-forest-100 to-earth-50 dark:from-forest-950 dark:via-forest-900 dark:to-earth-950">
      {/* Brand panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-forest-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-earth-300 blur-3xl" />
        </div>
        <div className="relative">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid place-items-center w-11 h-11 rounded-2xl bg-forest-600 text-white shadow-glow">
              <Sprout size={24} />
            </div>
            <span className="font-display text-2xl font-bold text-forest-800 dark:text-forest-50">AgriGuide AI</span>
          </Link>
        </div>

        <div className="relative space-y-8">
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight text-forest-900 dark:text-forest-50">
            Smart farming, <br /> made simple.
          </h1>
          <p className="text-lg text-forest-700 dark:text-forest-200 max-w-md">
            Manage your crops, expenses and tasks — and get practical AI guidance for everyday farm decisions.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <Feature icon={<Leaf size={18} />} label="Crop management" />
            <Feature icon={<TrendingUp size={18} />} label="Expense tracking" />
            <Feature icon={<CalendarClock size={18} />} label="Farm calendar" />
            <Feature icon={<Sprout size={18} />} label="AI assistant" />
          </div>
        </div>

        <p className="relative text-sm text-forest-600 dark:text-forest-400">
          Built for small farmers. Free to use.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3 justify-center">
            <div className="grid place-items-center w-11 h-11 rounded-2xl bg-forest-600 text-white shadow-glow">
              <Sprout size={24} />
            </div>
            <span className="font-display text-2xl font-bold text-forest-800 dark:text-forest-50">AgriGuide AI</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl glass px-4 py-3">
      <div className="grid place-items-center w-9 h-9 rounded-xl bg-forest-600/10 text-forest-700 dark:text-forest-200">
        {icon}
      </div>
      <span className="text-sm font-medium text-forest-800 dark:text-forest-100">{label}</span>
    </div>
  );
}
