import { useState, type FormEvent } from 'react';
import {
  Wheat, Plus, Pencil, Trash2, Search, Sprout, CalendarDays, Ruler, StickyNote,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Crop, CropStatus } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { fmtDate, classForStatus } from '../lib/utils';

const STATUSES: CropStatus[] = ['planning', 'growing', 'ready', 'harvested'];
const STATUS_LABELS: Record<CropStatus, string> = {
  planning: 'Planning',
  growing: 'Growing',
  ready: 'Ready to harvest',
  harvested: 'Harvested',
};

interface FormState {
  name: string;
  variety: string;
  sowing_date: string;
  harvest_date: string;
  area: string;
  area_unit: string;
  status: CropStatus;
  notes: string;
}

const EMPTY: FormState = {
  name: '', variety: '', sowing_date: '', harvest_date: '', area: '', area_unit: 'acres', status: 'growing', notes: '',
};

export default function CropsPage() {
  const { user } = useAuth();
  const [crops, setCrops] = useState<Crop[]>(() => (user ? db.getCrops(user.id) : []));
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CropStatus | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Crop | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Crop | null>(null);

  function reload() {
    if (user) setCrops(db.getCrops(user.id));
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(c: Crop) {
    setEditing(c);
    setForm({
      name: c.name,
      variety: c.variety ?? '',
      sowing_date: c.sowing_date ?? '',
      harvest_date: c.harvest_date ?? '',
      area: c.area != null ? String(c.area) : '',
      area_unit: c.area_unit ?? 'acres',
      status: c.status,
      notes: c.notes ?? '',
    });
    setError(null);
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    if (!form.name.trim()) { setError('Crop name is required.'); return; }
    const payload = {
      name: form.name.trim(),
      variety: form.variety.trim() || null,
      sowing_date: form.sowing_date || null,
      harvest_date: form.harvest_date || null,
      area: form.area ? Number(form.area) : null,
      area_unit: form.area_unit,
      status: form.status,
      notes: form.notes.trim() || null,
    };
    if (editing) {
      db.saveCrop(user.id, { ...payload, id: editing.id });
      db.logActivity(user.id, `Updated crop "${payload.name}"`, 'crops');
    } else {
      db.saveCrop(user.id, payload);
      db.logActivity(user.id, `Added crop "${payload.name}"`, 'crops');
    }
    setModalOpen(false);
    reload();
  }

  function handleDelete() {
    if (!deleteTarget || !user) return;
    db.deleteCrop(user.id, deleteTarget.id);
    db.logActivity(user.id, `Deleted crop "${deleteTarget.name}"`, 'crops');
    setDeleteTarget(null);
    reload();
  }

  const filtered = crops.filter((c) => {
    const matchesQuery = !query || c.name.toLowerCase().includes(query.toLowerCase()) || (c.variety ?? '').toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Crops"
        subtitle="Track every crop from sowing to harvest."
        icon={Wheat}
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus size={18} /> Add Crop
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crops…"
            className="input-field pl-11"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All</FilterChip>
          {STATUSES.map((s) => (
            <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {STATUS_LABELS[s]}
            </FilterChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-8">
          <EmptyState
            icon={<Sprout size={28} />}
            title={crops.length === 0 ? 'No crops yet' : 'No crops match your filters'}
            description={crops.length === 0 ? 'Add your first crop to start tracking sowing, harvest, and notes.' : 'Try a different search or filter.'}
            action={crops.length === 0 ? <button onClick={openAdd} className="btn-primary text-sm">Add your first crop</button> : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="glass-card p-5 group hover:-translate-y-0.5 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-11 h-11 rounded-2xl bg-forest-100 text-forest-700 dark:bg-forest-800/60 dark:text-forest-200">
                    <Sprout size={22} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-forest-900 dark:text-forest-50">{c.name}</h3>
                    {c.variety && <p className="text-xs text-forest-500 dark:text-forest-400">{c.variety}</p>}
                  </div>
                </div>
                <span className={`chip ${classForStatus(c.status)}`}>{STATUS_LABELS[c.status]}</span>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <Row icon={<CalendarDays size={15} />} label="Sowing" value={fmtDate(c.sowing_date)} />
                <Row icon={<CalendarDays size={15} />} label="Harvest" value={fmtDate(c.harvest_date)} />
                <Row icon={<Ruler size={15} />} label="Area" value={c.area != null ? `${c.area} ${c.area_unit}` : '—'} />
                {c.notes && (
                  <div className="flex gap-2 pt-1">
                    <StickyNote size={15} className="mt-0.5 text-forest-400 shrink-0" />
                    <p className="text-forest-600 dark:text-forest-300 line-clamp-2">{c.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => openEdit(c)} className="btn-secondary flex-1 text-sm py-2">
                  <Pencil size={15} /> Edit
                </button>
                <button onClick={() => setDeleteTarget(c)} className="btn-secondary !text-rose-600 !border-rose-200 hover:!bg-rose-50 dark:!border-rose-900/50 dark:hover:!bg-rose-900/30 text-sm py-2 px-3">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit crop' : 'Add crop'}
        description={editing ? `Update details for ${editing.name}` : 'Record a new crop on your farm.'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Crop name *">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wheat" className="input-field" />
            </Field>
            <Field label="Variety">
              <input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} placeholder="e.g. HD-2967" className="input-field" />
            </Field>
            <Field label="Sowing date">
              <input type="date" value={form.sowing_date} onChange={(e) => setForm({ ...form, sowing_date: e.target.value })} className="input-field" />
            </Field>
            <Field label="Harvest date">
              <input type="date" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} className="input-field" />
            </Field>
            <Field label="Area">
              <input type="number" step="0.01" min="0" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="2.5" className="input-field" />
            </Field>
            <Field label="Area unit">
              <select value={form.area_unit} onChange={(e) => setForm({ ...form, area_unit: e.target.value })} className="input-field">
                <option value="acres">acres</option>
                <option value="hectares">hectares</option>
                <option value="sqm">sq. meters</option>
                <option value="sqft">sq. feet</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CropStatus })} className="input-field">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Soil type, observations, treatments…" className="input-field resize-none" />
          </Field>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {editing ? 'Save changes' : 'Add crop'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete crop?"
        message={`This will permanently remove "${deleteTarget?.name ?? ''}" and unlink any related tasks. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        icon={Trash2}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
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

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-forest-600 dark:text-forest-300">
      <span className="text-forest-400">{icon}</span>
      <span className="text-xs font-medium text-forest-500 dark:text-forest-400 w-16">{label}</span>
      <span className="text-sm text-forest-800 dark:text-forest-100">{value}</span>
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
