export type Horizon = 'day' | 'week' | 'month' | 'year' | 'fiveYear';

export type ItemStatus = 'todo' | 'in_progress' | 'done';

export type Priority = 'low' | 'medium' | 'high';

export interface Category {
  id: string;
  name: string;
  color: string; // hex or tailwind color
  icon?: string;
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  horizon: Horizon;
  
  // Date and Time
  startDate: string; // ISO string 'YYYY-MM-DD' or full ISO
  endDate?: string;
  periodKey?: string; // e.g. '2026-W45', '2026-11', '2026', '2026-2031'
  time?: string; // 'HH:mm' e.g. '09:30'
  
  status: ItemStatus;
  priority: Priority;
  categoryId: string; // references Category
  
  // Hierarchy
  parentId?: string; // ID of higher horizon item
  
  // Manual progress override if no children (0-100)
  manualProgress?: number;
  
  // Extra metadata
  location?: string;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'none';
  tags?: string[];
  
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CalculatedItem extends Item {
  progress: number; // 0 to 100
  childrenCount: number;
  completedChildrenCount: number;
  isLeaf: boolean;
  derivedStatus: ItemStatus;
  children?: CalculatedItem[];
}

export type ViewMode = 'today' | 'week' | 'month' | 'year' | 'fiveYear' | 'goals';

