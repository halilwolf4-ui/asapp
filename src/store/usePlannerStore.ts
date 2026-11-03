import { create } from 'zustand';
import { Item, Category, ViewMode, Horizon, ItemStatus } from '../types';
import { storageRepo } from '../services/storage/storageRepository';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { SEED_ITEMS } from '../constants/seedData';
import { formatIsoDateOnly } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

interface PlannerState {
  items: Item[];
  categories: Category[];
  activeView: ViewMode;
  selectedDate: string; // 'yyyy-MM-dd'
  quote: string;
  
  // UI states
  isItemModalOpen: boolean;
  editingItem: Item | null;
  modalPresetHorizon: Horizon;
  modalPresetParentId?: string;
  modalPresetDate?: string;
  isStatsOpen: boolean;
  searchQuery: string;
  filterCategoryId: string | null;
  lastDeletedItem: Item | null;
  subGoalTipGoal: Item | null;

  // Actions
  init: () => Promise<void>;
  setActiveView: (view: ViewMode) => void;
  setSelectedDate: (date: string) => void;
  openCreateModal: (preset?: { horizon?: Horizon; parentId?: string; date?: string }) => void;
  openEditModal: (item: Item) => void;
  closeModal: () => void;
  dismissSubGoalTip: () => void;
  setStatsOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterCategory: (catId: string | null) => void;
  setQuote: (quote: string) => Promise<void>;

  // Data Actions
  addItem: (data: Partial<Item> & { title: string; horizon: Horizon; categoryId: string }) => Promise<void>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  toggleItemStatus: (id: string) => Promise<void>;
  moveItemDate: (id: string, newDate: string) => Promise<void>;
  resetToSampleData: () => Promise<void>;
  exportBackup: () => Promise<string>;
  importBackup: (json: string) => Promise<boolean>;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  items: [],
  categories: DEFAULT_CATEGORIES,
  activeView: 'today', // Start with Today view as default
  selectedDate: formatIsoDateOnly(new Date()),
  quote: 'Küçük adımlar, büyük vizyonların temelidir.',
  
  isItemModalOpen: false,
  editingItem: null,
  modalPresetHorizon: 'day',
  modalPresetParentId: undefined,
  modalPresetDate: undefined,
  isStatsOpen: false,
  searchQuery: '',
  filterCategoryId: null,
  lastDeletedItem: null,
  subGoalTipGoal: null,

  init: async () => {
    let items = await storageRepo.getItems();
    let categories = await storageRepo.getCategories();
    const quote = await storageRepo.getQuote();

    if (!items || items.length === 0) {
      items = SEED_ITEMS;
      await storageRepo.saveItems(items);
    }

    if (!categories || categories.length === 0) {
      categories = DEFAULT_CATEGORIES;
      await storageRepo.saveCategories(categories);
    }

    set({ items, categories, quote });
  },

  setActiveView: (view) => set({ activeView: view }),
  
  setSelectedDate: (date) => set({ selectedDate: date }),

  openCreateModal: (preset) => {
    const { activeView, selectedDate } = get();
    let defaultHorizon: Horizon = 'day';
    if (activeView === 'week') defaultHorizon = 'week';
    else if (activeView === 'month') defaultHorizon = 'month';
    else if (activeView === 'year') defaultHorizon = 'year';
    else if (activeView === 'fiveYear') defaultHorizon = 'fiveYear';

    set({
      isItemModalOpen: true,
      editingItem: null,
      modalPresetHorizon: preset?.horizon || defaultHorizon,
      modalPresetParentId: preset?.parentId,
      modalPresetDate: preset?.date || selectedDate,
    });
  },

  openEditModal: (item) => {
    set({
      isItemModalOpen: true,
      editingItem: item,
      modalPresetHorizon: item.horizon,
      modalPresetParentId: item.parentId,
      modalPresetDate: item.startDate,
    });
  },

  closeModal: () => {
    set({
      isItemModalOpen: false,
      editingItem: null,
      modalPresetParentId: undefined,
      modalPresetDate: undefined,
    });
  },

  dismissSubGoalTip: () => set({ subGoalTipGoal: null }),

  setStatsOpen: (open) => set({ isStatsOpen: open }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterCategory: (filterCategoryId) => set({ filterCategoryId }),

  setQuote: async (quote) => {
    await storageRepo.saveQuote(quote);
    set({ quote });
  },

  addItem: async (data) => {
    const now = new Date().toISOString();
    const newItem: Item = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: data.title.trim(),
      description: data.description?.trim(),
      horizon: data.horizon,
      startDate: data.startDate || get().selectedDate,
      endDate: data.endDate,
      time: data.time,
      location: data.location,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      categoryId: data.categoryId || 'personal',
      parentId: data.parentId || undefined,
      recurrence: data.recurrence || 'none',
      manualProgress: data.manualProgress,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newItem, ...get().items];
    await storageRepo.saveItems(updated);
    const isGrandHorizon = ['fiveYear', 'year', 'month'].includes(newItem.horizon);
    set({
      items: updated,
      isItemModalOpen: false,
      editingItem: null,
      subGoalTipGoal: isGrandHorizon ? newItem : null,
    });
  },

  updateItem: async (id, updates) => {
    const updated = get().items.map((item) => {
      if (item.id === id) {
        const isNowDone = updates.status === 'done' && item.status !== 'done';
        return {
          ...item,
          ...updates,
          completedAt: isNowDone ? new Date().toISOString() : updates.status !== 'done' ? undefined : item.completedAt,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    await storageRepo.saveItems(updated);
    set({ items: updated, isItemModalOpen: false, editingItem: null });
  },

  deleteItem: async (id) => {
    const target = get().items.find((i) => i.id === id);
    if (!target) return;

    // Remove item and re-parent its children or keep them as roots
    const updated = get().items
      .filter((i) => i.id !== id)
      .map((i) => (i.parentId === id ? { ...i, parentId: undefined } : i));

    await storageRepo.saveItems(updated);
    set({ items: updated, lastDeletedItem: target });
  },

  undoDelete: async () => {
    const { lastDeletedItem, items } = get();
    if (!lastDeletedItem) return;

    const updated = [lastDeletedItem, ...items];
    await storageRepo.saveItems(updated);
    set({ items: updated, lastDeletedItem: null });
  },

  toggleItemStatus: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    let nextStatus: ItemStatus = 'done';
    if (item.status === 'done') {
      nextStatus = 'todo';
    } else if (item.status === 'todo') {
      nextStatus = 'done';
    } else {
      nextStatus = 'done';
    }

    if (nextStatus === 'done') {
      // Trigger mint celebration confetti!
      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.8 },
          colors: ['#2EE6B6', '#FF3D7F', '#8A4FFF', '#FFB800'],
        });
      } catch {
        // ignore in non-browser or test environments
      }
    }

    await get().updateItem(id, {
      status: nextStatus,
      completedAt: nextStatus === 'done' ? new Date().toISOString() : undefined,
    });
  },

  moveItemDate: async (id, newDate) => {
    await get().updateItem(id, { startDate: newDate });
  },

  resetToSampleData: async () => {
    await storageRepo.clearAll();
    await storageRepo.saveItems(SEED_ITEMS);
    await storageRepo.saveCategories(DEFAULT_CATEGORIES);
    set({ items: SEED_ITEMS, categories: DEFAULT_CATEGORIES });
  },

  exportBackup: async () => {
    return await storageRepo.exportData();
  },

  importBackup: async (json) => {
    const success = await storageRepo.importData(json);
    if (success) {
      await get().init();
    }
    return success;
  },
}));

