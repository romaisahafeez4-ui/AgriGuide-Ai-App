import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wheat, Wallet, CalendarClock, Bot, Leaf,
  Plus, TrendingUp, ArrowRight, Activity as ActivityIcon, CheckCircle2, Circle, Sprout,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Crop, Expense, FarmTask, Activity } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import { fmtMoney, fmtRelative, fmtDueLabel, classForStatus, classForTaskType } from '../lib/utils';
import { format, parseISO } from 'date-fns';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!user) return;
    setCrops(db.getCrops(user.id));
    setTasks(db.getTasks(user.id));
    setExpenses(db.getExpenses(user.id));
    setActivities(db.getActivities(user.id));
    setLoading(false);
  }, [user]);

  const activeCrops = crops.filter((c) => c.status === 'growing' || c.status === 'ready');
  const upcomingTasks = tasks.filter((t) => !t.completed).slice(0, 5);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const monthKey = format(new Date(), 'yyyy-MM');
  const monthExpenses = expenses
    .filter((e) => e.expense_date?.startsWith(monthKey))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Farmer';

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`${greeting}, ${displayName.split(' ')[0]}!`}
        subtitle={profile?.farm_name ? `Here's what's happening at ${profile.farm_name} today.` : "Here's your farm overview."}
        icon={LayoutDashboard}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Crops"
          value={String(activeCrops.length)}
          sub={`${crops.length} total crops`}
          icon={Wheat}
          tone="forest"
          onClick={() => navigate('/crops')}
        />
        <StatCard
          label="Upcoming Tasks"
          value={String(upcomingTasks.length)}
          sub={`${tasks.filter((t) => t.completed).length} completed`}
          icon={CalendarClock}
          tone="sky"
          onClick={() => navigate('/calendar')}
        />
        <StatCard
          label="Total Expenses"
          value={fmtMoney(totalExpenses)}
          sub={`${fmtMoney(monthExpenses)} this month`}
          icon={Wallet}
          tone="earth"
          onClick={() => navigate('/expenses')}
        />
        <StatCard
          label="Ask AI"
          value="Assistant"
          sub="Get farming advice"
          icon={Bot}
          tone="accent"
          onClick={() => navigate('/assistant')}
        />
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickAction icon={Plus} label="Add Crop" onClick={() => navigate('/crops')} />
          <QuickAction icon={Wallet} label="Add Expense" onClick={() => navigate('/expenses')} />
          <QuickAction icon={CalendarClock} label="Add Task" onClick={() => navigate('/calendar')} />
          <QuickAction icon={Bot} label="Ask AI" onClick={() => navigate('/assistant')} />
          <QuickAction icon={Leaf} label="Check Plant" onClick={() => navigate('/plant-health')} />
          <QuickAction icon={Sprout} label="My Crops" onClick={() => navigate('/crops')} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming tasks */}
        <section className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 flex items-center gap-2">
              <CalendarClock size={20} className="text-forest-600 dark:text-forest-300" />
              Upcoming Tasks
            </h2>
            <button onClick={() => navigate('/calendar')} className="btn-ghost text-sm">
              View all <ArrowRight size={16} />
            </button>
          </div>
          {upcomingTasks.length === 0 ? (
            <EmptyState
              icon={<CalendarClock size={28} />}
              title="No upcoming tasks"
              description="Add reminders for watering, fertilizer, or harvest."
              action={<button onClick={() => navigate('/calendar')} className="btn-primary text-sm">Add task</button>}
            />
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-white/60 dark:bg-forest-900/40 px-4 py-3 border border-forest-100 dark:border-forest-800/60">
                  {t.completed ? <CheckCircle2 size={20} className="text-forest-500" /> : <Circle size={20} className="text-forest-300 dark:text-forest-600" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-forest-900 dark:text-forest-50 truncate">{t.title}</p>
                    <p className="text-xs text-forest-500 dark:text-forest-400">{fmtDueLabel(t.due_date)}</p>
                  </div>
                  <span className={`chip ${classForTaskType(t.type)}`}>{t.type}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent activity */}
        <section className="glass-card p-5">
          <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 flex items-center gap-2 mb-4">
            <ActivityIcon size={20} className="text-forest-600 dark:text-forest-300" />
            Recent Activity
          </h2>
          {activities.length === 0 ? (
            <EmptyState icon={<ActivityIcon size={28} />} title="No activity yet" description="Actions you take will appear here." />
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-forest-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-forest-800 dark:text-forest-100">{a.action}</p>
                    {a.entity && <p className="text-xs text-forest-500 dark:text-forest-400 truncate">{a.entity}</p>}
                    <p className="text-[11px] text-forest-400 dark:text-forest-500">{fmtRelative(a.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Active crops preview */}
      <section className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 flex items-center gap-2">
            <Wheat size={20} className="text-forest-600 dark:text-forest-300" />
            Active Crops
          </h2>
          <button onClick={() => navigate('/crops')} className="btn-ghost text-sm">
            View all <ArrowRight size={16} />
          </button>
        </div>
        {activeCrops.length === 0 ? (
          <EmptyState
            icon={<Wheat size={28} />}
            title="No active crops"
            description="Add your first crop to start tracking its progress."
            action={<button onClick={() => navigate('/crops')} className="btn-primary text-sm">Add crop</button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeCrops.slice(0, 6).map((c) => (
              <div key={c.id} className="rounded-2xl bg-white/60 dark:bg-forest-900/40 border border-forest-100 dark:border-forest-800/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-forest-900 dark:text-forest-50">{c.name}</p>
                    {c.variety && <p className="text-xs text-forest-500 dark:text-forest-400">{c.variety}</p>}
                  </div>
                  <span className={`chip ${classForStatus(c.status)}`}>{c.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-forest-500 dark:text-forest-400">
                  <span>Sown: {c.sowing_date ? format(parseISO(c.sowing_date), 'MMM d') : '—'}</span>
                  <span>{c.area ? `${c.area} ${c.area_unit}` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const TONES: Record<string, string> = {
  forest: 'from-forest-500 to-forest-700',
  sky: 'from-sky-500 to-sky-700',
  earth: 'from-earth-500 to-earth-700',
  accent: 'from-amber-500 to-amber-700',
};

function StatCard({
  label, value, sub, icon: Icon, tone, onClick,
}: {
  label: string; value: string; sub: string; icon: typeof Wheat; tone: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group glass-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-forest-600 dark:text-forest-300">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-forest-900 dark:text-forest-50">{value}</p>
          <p className="mt-1 text-xs text-forest-500 dark:text-forest-400 flex items-center gap-1">
            <TrendingUp size={12} /> {sub}
          </p>
        </div>
        <div className={`grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br ${TONES[tone]} text-white shadow-soft`}>
          <Icon size={22} />
        </div>
      </div>
    </button>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-2xl glass p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="grid place-items-center w-10 h-10 rounded-xl bg-forest-100 text-forest-700 dark:bg-forest-800/60 dark:text-forest-200 group-hover:bg-forest-600 group-hover:text-white transition">
        <Icon size={20} />
      </div>
      <span className="text-xs font-medium text-forest-700 dark:text-forest-200">{label}</span>
    </button>
  );
}
