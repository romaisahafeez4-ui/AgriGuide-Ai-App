export type CropStatus = 'planning' | 'growing' | 'ready' | 'harvested';

export interface Crop {
  id: string;
  user_id: string;
  name: string;
  variety: string | null;
  sowing_date: string | null;
  harvest_date: string | null;
  area: number | null;
  area_unit: string;
  status: CropStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory =
  | 'seeds'
  | 'fertilizer'
  | 'pesticides'
  | 'equipment'
  | 'labour'
  | 'other';

export interface Expense {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  expense_date: string;
  created_at: string;
}

export type TaskType = 'watering' | 'fertilizer' | 'harvest' | 'other';

export interface FarmTask {
  id: string;
  user_id: string;
  title: string;
  type: TaskType;
  due_date: string;
  crop_id: string | null;
  notes: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  action: string;
  entity: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  farm_name: string | null;
  avatar_url: string | null;
  theme: 'light' | 'dark';
  created_at: string;
  updated_at: string;
}
