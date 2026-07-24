import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="grid place-items-center w-11 h-11 rounded-2xl bg-forest-100 text-forest-700 dark:bg-forest-800/60 dark:text-forest-200 shadow-card">
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-forest-900 dark:text-forest-50">{title}</h1>
          {subtitle && <p className="text-sm text-forest-600 dark:text-forest-300 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
