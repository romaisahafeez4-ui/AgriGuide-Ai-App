import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 animate-fade-in">
      {icon && (
        <div className="mb-4 grid place-items-center w-16 h-16 rounded-3xl bg-forest-100 text-forest-500 dark:bg-forest-800/60 dark:text-forest-300">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-forest-600 dark:text-forest-300">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
