import { storage, uid } from './storage';
import type {
  Crop, Expense, FarmTask, Activity, ChatMessage, Profile,
} from './types';

// All app data lives in localStorage under the agruide: namespace.
// Users are stored separately so credentials persist across reloads.

export interface StoredUser {
  id: string;
  email: string;
  // We store a lightweight hash so passwords are never in plain text.
  passwordHash: string;
  createdAt: string;
}

const USERS_KEY = 'users';
const SESSION_KEY = 'session';
const PROFILE_KEY = (uid: string) => `profile:${uid}`;
const CROPS_KEY = (uid: string) => `crops:${uid}`;
const EXPENSES_KEY = (uid: string) => `expenses:${uid}`;
const TASKS_KEY = (uid: string) => `tasks:${uid}`;
const ACTIVITIES_KEY = (uid: string) => `activities:${uid}`;
const CHAT_KEY = (uid: string) => `chat:${uid}`;

// Tiny non-crypto hash. Good enough to avoid storing raw passwords in
// localStorage for a demo app; not for real production use.
export function hashPassword(password: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < password.length; i++) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

export const db = {
  // ---- Auth ----
  getUsers(): StoredUser[] {
    return storage.get<StoredUser[]>(USERS_KEY, []);
  },
  findUserByEmail(email: string): StoredUser | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  registerUser(email: string, password: string): { user?: StoredUser; error?: string } {
    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { error: 'An account with this email already exists.' };
    }
    const user: StoredUser = {
      id: uid(),
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    storage.set(USERS_KEY, [...users, user]);
    // seed an empty profile
    storage.set<Profile>(PROFILE_KEY(user.id), {
      id: user.id, full_name: null, farm_name: null, avatar_url: null, theme: 'light',
      created_at: user.createdAt, updated_at: user.createdAt,
    });
    return { user };
  },
  verifyCredentials(email: string, password: string): { user?: StoredUser; error?: string } {
    const user = this.findUserByEmail(email);
    if (!user) return { error: 'No account found with this email.' };
    if (user.passwordHash !== hashPassword(password)) return { error: 'Incorrect password.' };
    return { user };
  },
  setSession(userId: string): void {
    storage.set(SESSION_KEY, userId);
  },
  getSession(): string | null {
    return storage.get<string | null>(SESSION_KEY, null);
  },
  clearSession(): void {
    storage.remove(SESSION_KEY);
  },
  changePassword(userId: string, newPassword: string): { error?: string } {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { error: 'Account not found.' };
    users[idx] = { ...users[idx], passwordHash: hashPassword(newPassword) };
    storage.set(USERS_KEY, users);
    return {};
  },

  // ---- Profile ----
  getProfile(userId: string): Profile {
    return storage.get<Profile>(PROFILE_KEY(userId), {
      id: userId, full_name: null, farm_name: null, avatar_url: null, theme: 'light',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
  },
  updateProfile(userId: string, patch: Partial<Profile>): Profile {
    const current = this.getProfile(userId);
    const updated: Profile = { ...current, ...patch, id: userId, updated_at: new Date().toISOString() };
    storage.set(PROFILE_KEY(userId), updated);
    return updated;
  },

  // ---- Crops ----
  getCrops(userId: string): Crop[] {
    return storage.get<Crop[]>(CROPS_KEY(userId), []);
  },
  saveCrop(userId: string, crop: Omit<Crop, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }): Crop {
    const crops = this.getCrops(userId);
    if (crop.id) {
      const idx = crops.findIndex((c) => c.id === crop.id);
      if (idx !== -1) {
        crops[idx] = { ...crops[idx], ...crop, id: crop.id, updated_at: new Date().toISOString() };
        storage.set(CROPS_KEY(userId), crops);
        return crops[idx];
      }
    }
    const now = new Date().toISOString();
    const newCrop: Crop = {
      id: uid(), user_id: userId,
      name: crop.name, variety: crop.variety ?? null,
      sowing_date: crop.sowing_date ?? null, harvest_date: crop.harvest_date ?? null,
      area: crop.area ?? null, area_unit: crop.area_unit ?? 'acres',
      status: crop.status ?? 'growing', notes: crop.notes ?? null,
      created_at: now, updated_at: now,
    };
    storage.set(CROPS_KEY(userId), [newCrop, ...crops]);
    return newCrop;
  },
  deleteCrop(userId: string, cropId: string): void {
    const crops = this.getCrops(userId).filter((c) => c.id !== cropId);
    storage.set(CROPS_KEY(userId), crops);
    // also remove linked tasks' crop_id reference
    const tasks = this.getTasks(userId).map((t) => (t.crop_id === cropId ? { ...t, crop_id: null } : t));
    storage.set(TASKS_KEY(userId), tasks);
  },

  // ---- Expenses ----
  getExpenses(userId: string): Expense[] {
    return storage.get<Expense[]>(EXPENSES_KEY(userId), []);
  },
  saveExpense(userId: string, expense: Omit<Expense, 'id' | 'user_id' | 'created_at'> & { id?: string }): Expense {
    const expenses = this.getExpenses(userId);
    if (expense.id) {
      const idx = expenses.findIndex((e) => e.id === expense.id);
      if (idx !== -1) {
        expenses[idx] = { ...expenses[idx], ...expense, id: expense.id };
        storage.set(EXPENSES_KEY(userId), expenses);
        return expenses[idx];
      }
    }
    const newExp: Expense = {
      id: uid(), user_id: userId,
      category: expense.category, description: expense.description ?? null,
      amount: expense.amount, expense_date: expense.expense_date,
      created_at: new Date().toISOString(),
    };
    storage.set(EXPENSES_KEY(userId), [newExp, ...expenses]);
    return newExp;
  },
  deleteExpense(userId: string, expenseId: string): void {
    storage.set(EXPENSES_KEY(userId), this.getExpenses(userId).filter((e) => e.id !== expenseId));
  },

  // ---- Tasks ----
  getTasks(userId: string): FarmTask[] {
    return storage.get<FarmTask[]>(TASKS_KEY(userId), []);
  },
  saveTask(userId: string, task: Omit<FarmTask, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }): FarmTask {
    const tasks = this.getTasks(userId);
    if (task.id) {
      const idx = tasks.findIndex((t) => t.id === task.id);
      if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], ...task, id: task.id, updated_at: new Date().toISOString() };
        storage.set(TASKS_KEY(userId), tasks);
        return tasks[idx];
      }
    }
    const now = new Date().toISOString();
    const newTask: FarmTask = {
      id: uid(), user_id: userId,
      title: task.title, type: task.type, due_date: task.due_date,
      crop_id: task.crop_id ?? null, notes: task.notes ?? null,
      completed: task.completed ?? false,
      created_at: now, updated_at: now,
    };
    storage.set(TASKS_KEY(userId), [newTask, ...tasks]);
    return newTask;
  },
  toggleTask(userId: string, taskId: string): void {
    const tasks = this.getTasks(userId).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed, updated_at: new Date().toISOString() } : t
    );
    storage.set(TASKS_KEY(userId), tasks);
  },
  deleteTask(userId: string, taskId: string): void {
    storage.set(TASKS_KEY(userId), this.getTasks(userId).filter((t) => t.id !== taskId));
  },

  // ---- Activities ----
  getActivities(userId: string): Activity[] {
    return storage.get<Activity[]>(ACTIVITIES_KEY(userId), []);
  },
  logActivity(userId: string, action: string, entity: string | null = null): void {
    const activities = this.getActivities(userId);
    const entry: Activity = {
      id: uid(), user_id: userId, action, entity,
      created_at: new Date().toISOString(),
    };
    // keep most recent 50
    storage.set(ACTIVITIES_KEY(userId), [entry, ...activities].slice(0, 50));
  },

  // ---- Chat ----
  getChat(userId: string): ChatMessage[] {
    return storage.get<ChatMessage[]>(CHAT_KEY(userId), []);
  },
  addChatMessage(userId: string, role: 'user' | 'assistant', content: string): ChatMessage {
    const messages = this.getChat(userId);
    const msg: ChatMessage = {
      id: uid(), user_id: userId, role, content,
      created_at: new Date().toISOString(),
    };
    storage.set(CHAT_KEY(userId), [...messages, msg]);
    return msg;
  },
  clearChat(userId: string): void {
    storage.set(CHAT_KEY(userId), []);
  },
};
