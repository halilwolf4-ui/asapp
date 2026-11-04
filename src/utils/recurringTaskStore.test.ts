import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from '../store/usePlannerStore';
import { storageRepo } from '../services/storage/storageRepository';

describe('Recurring tasks in usePlannerStore', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(async () => {
    mockStorage = {};
    const storageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };
    // @ts-expect-error mock localStorage
    globalThis.localStorage = storageMock;
    // @ts-expect-error mock window
    globalThis.window = { localStorage: storageMock };

    await storageRepo.clearAll();
    usePlannerStore.setState({
      items: [],
      categories: [],
      selectedDate: '2026-11-04',
      isItemModalOpen: false,
      editingItem: null,
    });
  });

  it('creates recurring weekly tasks on specified days until end date', async () => {
    const store = usePlannerStore.getState();
    await store.addItem({
      title: 'Haftalık Koşu',
      horizon: 'day',
      categoryId: 'health',
      startDate: '2026-11-02', // Monday
      recurrence: 'weekly',
      recurrenceDaysOfWeek: [1, 3], // Mon, Wed
      recurrenceEndDate: '2026-11-15',
    });

    const items = usePlannerStore.getState().items;
    expect(items.length).toBe(4);
    const dates = items.map((i) => i.startDate).sort();
    expect(dates).toEqual(['2026-11-02', '2026-11-04', '2026-11-09', '2026-11-11']);
    expect(items[0].recurrenceGroupId).toBeDefined();
  });

  it('finishItemAndClearFutureRecurrences marks target done and removes future recurrences', async () => {
    const store = usePlannerStore.getState();
    await store.addItem({
      title: 'Haftalık Koşu',
      horizon: 'day',
      categoryId: 'health',
      startDate: '2026-11-02', // Monday
      recurrence: 'weekly',
      recurrenceDaysOfWeek: [1, 3], // Mon, Wed
      recurrenceEndDate: '2026-11-15',
    });

    let items = usePlannerStore.getState().items;
    const sorted = [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const firstMon = sorted[0]; // 2026-11-02
    const firstWed = sorted[1]; // 2026-11-04

    // First Monday is completed
    await usePlannerStore.getState().updateItem(firstMon.id, { status: 'done' });

    // On Wednesday, user presses "Bitir"
    await usePlannerStore.getState().finishItemAndClearFutureRecurrences(firstWed.id);

    items = usePlannerStore.getState().items;
    // Future ones (2026-11-09, 2026-11-11) should be removed!
    expect(items.length).toBe(2);

    const completedWed = items.find((i) => i.id === firstWed.id);
    expect(completedWed?.status).toBe('done');
    expect(completedWed?.manualProgress).toBe(100);

    const prevMon = items.find((i) => i.id === firstMon.id);
    expect(prevMon?.status).toBe('done');
  });

  it('works seamlessly on subtasks with parentId', async () => {
    const store = usePlannerStore.getState();
    // Create parent goal
    await store.addItem({
      title: 'Büyük Proje',
      horizon: 'month',
      categoryId: 'career',
      startDate: '2026-11-01',
    });

    const parent = usePlannerStore.getState().items[0];

    // Create recurring subtask linked to parent
    await store.addItem({
      title: 'Günlük Standup',
      horizon: 'day',
      categoryId: 'career',
      parentId: parent.id,
      startDate: '2026-11-04',
      recurrence: 'daily',
      recurrenceEndDate: '2026-11-06',
    });

    const subtasks = usePlannerStore.getState().items.filter((i) => i.parentId === parent.id);
    expect(subtasks.length).toBe(3);
    subtasks.forEach((s) => {
      expect(s.parentId).toBe(parent.id);
    });
  });
});
