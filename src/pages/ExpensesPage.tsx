import { useMemo, useState, type FormEvent } from 'react';
import {
  Wallet, Plus, Pencil, Trash2, Search, Sprout, TrendingDown, CalendarDays,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Expense, ExpenseCategory } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { fmtMoney, fmtDate, classForExpenseCategory } from '../lib/utils';
import { format } from 'date-fns';

const CATEGORIES: ExpenseCategory[] = ['seeds', 'fertilizer', 'pesticides', 'equipment', 'labour', 'other'];
const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  seeds: 'Seeds',
  fertilizer: 'Fertilizer',
  pesticides: 'Pesticides',
  equipment: 'Equipment',
  labour: 'Labour',
  other: 'Other',
};

interface FormState {
  category: ExpenseCategory;
  description: string;
  amount: string;
  expense_date: string;
}

const EMPTY: FormState = { category: 'seeds', description: '', amount: '', expense_date: format(new Date(), 'yyyy-MM-dd') };

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>(() => (user ? db.getExpenses(user.id) : []));
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<ExpenseCategory | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  function reload() {
    if (user) setExpenses(db.getExpenses(user.id));
  }

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, expense_date: format(new Date(), 'yyyy-MM-dd') });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setForm({
      category: e.category,
      description: e.description ?? '',
      amount: String(e.amount),
      expense_date: e.expense_date,
    });
    setError(null);
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { setError('Enter a valid amount.'); return; }

    const payload = {
      category: form.category,
      description: form.description.trim() || null,
      amount,
      expense_date: form.expense_date,
    };

    if (editing) {
      db.saveExpense(user.id, { ...payload, id: editing.id });
      db.logActivity(user.id, `Updated ${CATEGORY_LABELS[form.category]} expense`, 'expenses');
    } else {
      db.saveExpense(user.id, payload);
      db.logActivity(user.id, `Added ${CATEGORY_LABELS[form.category]} expense of ${fmtMoney(amount)}`, 'expenses');
    }
    setModalOpen(false);
    reload();
  }

  function handleDelete() {
    if (!deleteTarget || !user) return;
    db.deleteExpense(user.id, deleteTarget.id);
    db.logActivity(user.id, `Deleted expense`, 'expenses');
    setDeleteTarget(null);
    reload();
  }

  const filtered = expenses.filter((e) => {
    const matchesQuery = !query || (e.description ?? '').toLowerCase().includes(query.toLowerCase()) || CATEGORY_LABELS[e.category].toLowerCase().includes(query.toLowerCase());
    const matchesCat = catFilter === 'all' || e.category === catFilter;
    return matchesQuery && matchesCat;
  });

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const thisMonth = expenses.filter((e) => e.expense_date?.startsWith(format(new Date(), 'yyyy-MM'))).reduce((s, e) => s + Number(e.amount), 0);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = expenses.filter((e) => e.expense_date?.startsWith(format(lastMonthDate, 'yyyy-MM'))).reduce((s, e) => s + Number(e.amount), 0);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) map[e.category] = (map[e.category] ?? 0) + Number(e.amount);
    return map;
  }, [expenses]);

  const monthly = useMemo(() => {
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = format(d, 'yyyy-MM');
      months.push({ key, label: format(d, 'MMM'), total: 0 });
    }
    for (const e of expenses) {
      const m = months.find((x) => e.expense_date?.startsWith(x.key));
      if (m) m.total += Number(e.amount);
    }
    return months;
  }, [expenses]);
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.total));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Expenses"
        subtitle="Track every dollar you spend on the farm."
        icon={Wallet}
        action={<button onClick={openAdd} className="btn-primary"><Plus size={18} /> Add Expense</button>}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Total Expenses" value={fmtMoney(total)} icon={<Wallet size={20} />} tone="earth" />
        <SummaryCard label="This Month" value={fmtMoney(thisMonth)} icon={<CalendarDays size={20} />} tone="forest" />
        <SummaryCard label="Last Month" value={fmtMoney(lastMonth)} icon={<TrendingDown size={20} />} tone="sky" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly bar chart */}
        <section className="glass-card p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 mb-4">Monthly Summary</h2>
          <div className="flex items-end justify-between gap-3 h-48 pt-4">
            {monthly.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-forest-600 to-forest-400 transition-all hover:from-forest-700 hover:to-forest-500 relative group"
                    style={{ height: `${(m.total / maxMonthly) * 100}%`, minHeight: m.total > 0 ? '8px' : '2px' }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-forest-700 dark:text-forest-200 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {fmtMoney(m.total)}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-forest-500 dark:text-forest-400">{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Category breakdown */}
        <section className="glass-card p-5">
          <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 mb-4">By Category</h2>
          <ul className="space-y-3">
            {CATEGORIES.map((c) => {
              const amt = byCategory[c] ?? 0;
              const pct = total > 0 ? (amt / total) * 100 : 0;
              return (
                <li key={c}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-forest-700 dark:text-forest-200">{CATEGORY_LABELS[c]}</span>
                    <span className="text-forest-600 dark:text-forest-300">{fmtMoney(amt)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-forest-100 dark:bg-forest-800/60 overflow-hidden">
                    <div className="h-full rounded-full bg-forest-500" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search expenses…" className="input-field pl-11" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={catFilter === 'all'} onClick={() => setCatFilter('all')}>All</FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>{CATEGORY_LABELS[c]}</FilterChip>
          ))}
        </div>
      </div>

      {/* History */}
      {filtered.length === 0 ? (
        <div className="glass-card p-8">
          <EmptyState
            icon={<Wallet size={28} />}
            title={expenses.length === 0 ? 'No expenses recorded' : 'No expenses match your filters'}
            description={expenses.length === 0 ? 'Track seeds, fertilizer, labour and more to see where your money goes.' : 'Try a different search or category.'}
            action={expenses.length === 0 ? <button onClick={openAdd} className="btn-primary text-sm">Add expense</button> : undefined}
          />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <ul className="divide-y divide-forest-100 dark:divide-forest-800/60">
            {filtered.map((e) => (
              <li key={e.id} className="group flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-forest-50/60 dark:hover:bg-forest-800/30 transition">
                <div className="grid place-items-center w-10 h-10 rounded-xl bg-forest-100 text-forest-700 dark:bg-forest-800/60 dark:text-forest-200 shrink-0">
                  <Sprout size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`chip ${classForExpenseCategory(e.category)}`}>{CATEGORY_LABELS[e.category]}</span>
                    {e.description && <span className="text-sm text-forest-700 dark:text-forest-200 truncate">{e.description}</span>}
                  </div>
                  <p className="text-xs text-forest-500 dark:text-forest-400 mt-0.5">{fmtDate(e.expense_date)}</p>
                </div>
                <span className="font-display font-semibold text-forest-900 dark:text-forest-50">{fmtMoney(e.amount)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(e)} className="p-2 rounded-xl text-forest-600 hover:bg-forest-100 dark:hover:bg-forest-800/60" aria-label="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setDeleteTarget(e)} className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit expense' : 'Add expense'} description={editing ? 'Update this expense record.' : 'Record a new farm expense.'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })} className="input-field">
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </Field>
            <Field label="Amount *">
              <input type="number" step="0.01" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="input-field" />
            </Field>
          </div>
          <Field label="Description">
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Urea fertilizer for wheat" className="input-field" />
          </Field>
          <Field label="Date">
            <input type="date" required value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="input-field" />
          </Field>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {editing ? 'Save changes' : 'Add expense'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete expense?"
        message="This expense record will be permanently removed."
        confirmLabel="Delete"
        danger
        icon={Trash2}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

const TONES: Record<string, string> = {
  forest: 'from-forest-500 to-forest-700',
  earth: 'from-earth-500 to-earth-700',
  sky: 'from-sky-500 to-sky-700',
};

function SummaryCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-forest-600 dark:text-forest-300">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-forest-900 dark:text-forest-50">{value}</p>
        </div>
        <div className={`grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br ${TONES[tone]} text-white shadow-soft`}>{icon}</div>
      </div>
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

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`chip whitespace-nowrap transition ${
        active
          ? 'bg-forest-600 text-white'
          : 'bg-white/70 text-forest-700 border border-forest-200 hover:bg-forest-50 dark:bg-forest-900/50 dark:text-forest-200 dark:border-forest-800'
      }`}
    >
      {children}
    </button>
  );
}
