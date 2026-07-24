import { useMemo, useState, type FormEvent } from 'react';
import {
  CalendarClock, Plus, Pencil, Trash2, CheckCircle2, Circle, Droplets, FlaskConical, Wheat, ListTodo, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { FarmTask, TaskType, Crop } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { fmtDueLabel, classForTaskType } from '../lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, isToday } from 'date-fns';

const TYPES: TaskType[] = ['watering', 'fertilizer', 'harvest', 'other'];
const TYPE_LABELS: Record<TaskType, string> = {
  watering: 'Watering',
  fertilizer: 'Fertilizer',
  harvest: 'Harvest',
  other: 'Other',
};
const TYPE_ICONS: Record<TaskType, typeof Droplets> = {
  watering: Droplets,
  fertilizer: FlaskConical,
  harvest: Wheat,
  other: ListTodo,
};

interface FormState {
  title: string;
  type: TaskType;
  due_date: string;
  crop_id: string;
  notes: string;
}

const EMPTY: FormState = { title: '', type: 'watering', due_date: format(new Date(), 'yyyy-MM-dd'), crop_id: '', notes: '' };

export default function CalendarPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<FarmTask[]>(() => (user ? db.getTasks(user.id) : []));
  const [crops, setCrops] = useState<Crop[]>(() => (user ? db.getCrops(user.id) : []));
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FarmTask | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FarmTask | null>(null);

  function reload() {
    if (!user) return;
    setTasks(db.getTasks(user.id));
    setCrops(db.getCrops(user.id));
  }

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const tasksByDay = useMemo(() => {
    const map: Record<string, FarmTask[]> = {};
    for (const t of tasks) {
      if (!t.due_date) continue;
      const key = format(parseISO(t.due_date), 'yyyy-MM-dd');
      (map[key] ??= []).push(t);
    }
    return map;
  }, [tasks]);

  const upcoming = useMemo(() => {
    return tasks
      .filter((t) => !t.completed)
      .sort((a, b) => (a.due_date < b.due_date ? -1 : 1))
      .slice(0, 8);
  }, [tasks]);

  function openAdd(date?: Date) {
    setEditing(null);
    setForm({ ...EMPTY, due_date: format(date ?? new Date(), 'yyyy-MM-dd') });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(t: FarmTask) {
    setEditing(t);
    setForm({ title: t.title, type: t.type, due_date: t.due_date, crop_id: t.crop_id ?? '', notes: t.notes ?? '' });
    setError(null);
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    if (!form.title.trim()) { setError('Task title is required.'); return; }
    const payload = {
      title: form.title.trim(),
      type: form.type,
      due_date: form.due_date,
      crop_id: form.crop_id || null,
      notes: form.notes.trim() || null,
    };
    if (editing) {
      db.saveTask(user.id, { ...payload, id: editing.id, completed: editing.completed });
      db.logActivity(user.id, `Updated task "${payload.title}"`, 'tasks');
    } else {
      db.saveTask(user.id, { ...payload, completed: false });
      db.logActivity(user.id, `Added task "${payload.title}"`, 'tasks');
    }
    setModalOpen(false);
    reload();
  }

  function toggleComplete(t: FarmTask) {
    if (!user) return;
    db.toggleTask(user.id, t.id);
    db.logActivity(user.id, t.completed ? `Marked "${t.title}" incomplete` : `Completed task "${t.title}"`, 'tasks');
    reload();
  }

  function handleDelete() {
    if (!deleteTarget || !user) return;
    db.deleteTask(user.id, deleteTarget.id);
    db.logActivity(user.id, `Deleted task "${deleteTarget.title}"`, 'tasks');
    setDeleteTarget(null);
    reload();
  }

  const selectedDayTasks = selectedDay ? tasksByDay[format(selectedDay, 'yyyy-MM-dd')] ?? [] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Farm Calendar"
        subtitle="Reminders for watering, fertilizer, harvest and more."
        icon={CalendarClock}
        action={<button onClick={() => openAdd()} className="btn-primary"><Plus size={18} /> Add Task</button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <section className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50">{format(cursor, 'MMMM yyyy')}</h2>
            <div className="flex gap-1">
              <button onClick={() => setCursor(addMonths(cursor, -1))} className="btn-ghost p-2" aria-label="Previous month"><ChevronLeft size={18} /></button>
              <button onClick={() => { setCursor(new Date()); setSelectedDay(new Date()); }} className="btn-ghost text-sm">Today</button>
              <button onClick={() => setCursor(addMonths(cursor, 1))} className="btn-ghost p-2" aria-label="Next month"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-forest-500 dark:text-forest-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDay[key] ?? [];
              const inMonth = isSameMonth(day, cursor);
              const isSel = selectedDay && isSameDay(day, selectedDay);
              const today = isToday(day);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square sm:aspect-auto sm:min-h-[64px] rounded-xl p-1.5 flex flex-col items-start transition border ${
                    isSel
                      ? 'bg-forest-600 text-white border-forest-600'
                      : today
                      ? 'bg-forest-100 text-forest-800 border-forest-300 dark:bg-forest-800/60 dark:text-forest-100 dark:border-forest-600'
                      : inMonth
                      ? 'bg-white/50 text-forest-700 border-transparent hover:bg-forest-50 dark:bg-forest-900/30 dark:text-forest-200 dark:hover:bg-forest-800/40'
                      : 'bg-transparent text-forest-300 border-transparent dark:text-forest-700'
                  }`}
                >
                  <span className={`text-xs font-semibold ${isSel ? 'text-white' : ''}`}>{format(day, 'd')}</span>
                  {dayTasks.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-0.5">
                      {dayTasks.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className={`w-1.5 h-1.5 rounded-full ${t.completed ? 'bg-forest-300' : isSel ? 'bg-white' : 'bg-forest-500'}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-forest-600 dark:text-forest-300">
            {TYPES.map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${typeColor(t)}`} /> {TYPE_LABELS[t]}
              </span>
            ))}
          </div>
        </section>

        {/* Side panel: upcoming + selected day */}
        <section className="space-y-6">
          <div className="glass-card p-5">
            <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 mb-3">
              {selectedDay ? format(selectedDay, 'MMM d, yyyy') : 'Upcoming Tasks'}
            </h2>
            {selectedDay ? (
              selectedDayTasks.length === 0 ? (
                <EmptyState
                  icon={<CalendarClock size={24} />}
                  title="No tasks this day"
                  action={<button onClick={() => openAdd(selectedDay)} className="btn-primary text-sm">Add task</button>}
                />
              ) : (
                <ul className="space-y-2">
                  {selectedDayTasks.map((t) => <TaskRow key={t.id} task={t} cropName={crops.find((c) => c.id === t.crop_id)?.name} onToggle={toggleComplete} onEdit={openEdit} onDelete={setDeleteTarget} />)}
                  <li><button onClick={() => openAdd(selectedDay)} className="btn-ghost text-sm w-full"><Plus size={16} /> Add task</button></li>
                </ul>
              )
            ) : (
              upcoming.length === 0 ? (
                <EmptyState icon={<CalendarClock size={24} />} title="No upcoming tasks" description="Add reminders for watering, fertilizer, or harvest." action={<button onClick={() => openAdd()} className="btn-primary text-sm">Add task</button>} />
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((t) => <TaskRow key={t.id} task={t} cropName={crops.find((c) => c.id === t.crop_id)?.name} onToggle={toggleComplete} onEdit={openEdit} onDelete={setDeleteTarget} compact />)}
                </ul>
              )
            )}
          </div>
        </section>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit task' : 'Add task'} description={editing ? 'Update this reminder.' : 'Create a new farm reminder.'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Task title *">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Water the tomato beds" className="input-field" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TaskType })} className="input-field">
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label="Due date">
              <input type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="input-field" />
            </Field>
          </div>
          <Field label="Linked crop (optional)">
            <select value={form.crop_id} onChange={(e) => setForm({ ...form, crop_id: e.target.value })} className="input-field">
              <option value="">— None —</option>
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input-field resize-none" placeholder="Extra details…" />
          </Field>

          {error && <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200">{error}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Save changes' : 'Add task'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete task?" message={`"${deleteTarget?.title ?? ''}" will be permanently removed.`} confirmLabel="Delete" danger icon={Trash2} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function typeColor(t: TaskType): string {
  switch (t) {
    case 'watering': return 'bg-sky-500';
    case 'fertilizer': return 'bg-forest-500';
    case 'harvest': return 'bg-amber-500';
    default: return 'bg-earth-500';
  }
}

function TaskRow({
  task, cropName, onToggle, onEdit, onDelete, compact,
}: {
  task: FarmTask; cropName?: string; onToggle: (t: FarmTask) => void; onEdit: (t: FarmTask) => void; onDelete: (t: FarmTask) => void; compact?: boolean;
}) {
  const Icon = TYPE_ICONS[task.type];
  return (
    <li className="group flex items-center gap-3 rounded-2xl bg-white/60 dark:bg-forest-900/40 border border-forest-100 dark:border-forest-800/60 px-3 py-2.5">
      <button onClick={() => onToggle(task)} className="shrink-0" aria-label="Toggle complete">
        {task.completed ? <CheckCircle2 size={20} className="text-forest-500" /> : <Circle size={20} className="text-forest-300 dark:text-forest-600" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-forest-400 dark:text-forest-500' : 'text-forest-900 dark:text-forest-50'}`}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`chip ${classForTaskType(task.type)} !py-0.5`}><Icon size={11} /> {TYPE_LABELS[task.type]}</span>
          {!compact && <span className="text-xs text-forest-500 dark:text-forest-400">{fmtDueLabel(task.due_date)}</span>}
          {cropName && <span className="text-xs text-forest-500 dark:text-forest-400 truncate">· {cropName}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg text-forest-600 hover:bg-forest-100 dark:hover:bg-forest-800/60" aria-label="Edit"><Pencil size={14} /></button>
        <button onClick={() => onDelete(task)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" aria-label="Delete"><Trash2 size={14} /></button>
      </div>
    </li>
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
