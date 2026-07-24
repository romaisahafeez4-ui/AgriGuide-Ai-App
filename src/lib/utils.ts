import { format, formatDistanceToNow, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

export function fmtDate(date: string | Date | null, pattern = 'MMM d, yyyy'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, pattern);
}

export function fmtRelative(date: string | Date | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function fmtDueLabel(date: string | null): string {
  if (!date) return 'No date';
  const d = parseISO(date);
  if (Number.isNaN(d.getTime())) return '—';
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isPast(d)) return 'Overdue';
  return format(d, 'MMM d');
}

export function fmtMoney(amount: number | null | undefined): string {
  const v = Number(amount ?? 0);
  return v.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

export function initials(name: string | null | undefined): string {
  if (!name) return 'F';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function classForStatus(status: string): string {
  switch (status) {
    case 'planning':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
    case 'growing':
      return 'bg-forest-100 text-forest-700 dark:bg-forest-800/50 dark:text-forest-200';
    case 'ready':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    case 'harvested':
      return 'bg-forest-200 text-forest-800 dark:bg-forest-700/50 dark:text-forest-100';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function classForTaskType(type: string): string {
  switch (type) {
    case 'watering':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
    case 'fertilizer':
      return 'bg-forest-100 text-forest-700 dark:bg-forest-800/50 dark:text-forest-200';
    case 'harvest':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    default:
      return 'bg-earth-100 text-earth-700 dark:bg-earth-900/40 dark:text-earth-300';
  }
}

export function classForExpenseCategory(cat: string): string {
  switch (cat) {
    case 'seeds':
      return 'bg-forest-100 text-forest-700 dark:bg-forest-800/50 dark:text-forest-200';
    case 'fertilizer':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    case 'pesticides':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
    case 'equipment':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
    case 'labour':
      return 'bg-earth-100 text-earth-700 dark:bg-earth-900/40 dark:text-earth-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}
