import { type LucideIcon } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  icon?: LucideIcon;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
  icon: Icon,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
      <div className="relative w-full max-w-md glass-card p-6 animate-scale-in">
        <div className="flex items-start gap-4">
          {Icon && (
            <div
              className={`grid place-items-center w-12 h-12 rounded-2xl shrink-0 ${
                danger ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-forest-100 text-forest-600 dark:bg-forest-800/60 dark:text-forest-200'
              }`}
            >
              <Icon size={22} />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-forest-900 dark:text-forest-50">{title}</h3>
            <p className="mt-1.5 text-sm text-forest-600 dark:text-forest-300">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`btn-primary ${danger ? '!bg-rose-600 hover:!bg-rose-700' : ''}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
