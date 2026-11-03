import { describe, it, expect } from 'vitest';
import { calculateAllItemsProgress } from './progressCalculator';
import { Item } from '../types';

describe('Task Movement and Re-parenting Progress Recalculation', () => {
  it('recalculates progress when a task is moved from one parent to another', () => {
    // Initial state:
    // Goal A has 2 children: Task 1 (done: 100%), Task 2 (todo: 0%) -> Goal A progress = 50%
    // Goal B has 1 child: Task 3 (done: 100%) -> Goal B progress = 100%
    let items: Item[] = [
      {
        id: 'goal-a',
        title: 'Goal A',
        horizon: 'week',
        startDate: '2026-11-03',
        status: 'in_progress',
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-11-03',
        updatedAt: '2026-11-03',
      },
      {
        id: 'goal-b',
        title: 'Goal B',
        horizon: 'week',
        startDate: '2026-11-03',
        status: 'in_progress',
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-11-03',
        updatedAt: '2026-11-03',
      },
      {
        id: 'task-1',
        parentId: 'goal-a',
        title: 'Task 1',
        horizon: 'day',
        startDate: '2026-11-03',
        status: 'done',
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-11-03',
        updatedAt: '2026-11-03',
      },
      {
        id: 'task-2',
        parentId: 'goal-a',
        title: 'Task 2',
        horizon: 'day',
        startDate: '2026-11-04',
        status: 'todo',
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-11-03',
        updatedAt: '2026-11-03',
      },
      {
        id: 'task-3',
        parentId: 'goal-b',
        title: 'Task 3',
        horizon: 'day',
        startDate: '2026-11-03',
        status: 'done',
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-11-03',
        updatedAt: '2026-11-03',
      },
    ];

    const initialMap = calculateAllItemsProgress(items);
    expect(initialMap.get('goal-a')?.progress).toBe(50);
    expect(initialMap.get('goal-b')?.progress).toBe(100);

    // ACTION: Move Task 2 (todo: 0%) from Goal A to Goal B
    items = items.map((item) =>
      item.id === 'task-2' ? { ...item, parentId: 'goal-b' } : item
    );

    const updatedMap = calculateAllItemsProgress(items);
    // Goal A now has only Task 1 (done: 100%) -> progress is 100%
    expect(updatedMap.get('goal-a')?.progress).toBe(100);
    // Goal B now has Task 3 (done: 100%) and Task 2 (todo: 0%) -> progress is 50%
    expect(updatedMap.get('goal-b')?.progress).toBe(50);
  });

  it('preserves multi-level hierarchy progress when moving date or completing child', () => {
    let items: Item[] = [
      {
        id: '5y-vision',
        title: '5 Year Vision',
        horizon: 'fiveYear',
        startDate: '2026-01-01',
        status: 'in_progress',
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: '1y-goal',
        parentId: '5y-vision',
        title: '1 Year Goal',
        horizon: 'year',
        startDate: '2026-01-01',
        status: 'in_progress',
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'task-d1',
        parentId: '1y-goal',
        title: 'Day Task 1',
        horizon: 'day',
        startDate: '2026-11-03',
        status: 'todo',
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-11-03',
        updatedAt: '2026-11-03',
      },
      {
        id: 'task-d2',
        parentId: '1y-goal',
        title: 'Day Task 2',
        horizon: 'day',
        startDate: '2026-11-04',
        status: 'todo',
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-11-03',
        updatedAt: '2026-11-03',
      },
    ];

    let calc = calculateAllItemsProgress(items);
    expect(calc.get('1y-goal')?.progress).toBe(0);
    expect(calc.get('5y-vision')?.progress).toBe(0);

    // Complete task-d1
    items = items.map((i) => (i.id === 'task-d1' ? { ...i, status: 'done' } : i));
    calc = calculateAllItemsProgress(items);

    expect(calc.get('1y-goal')?.progress).toBe(50);
    expect(calc.get('5y-vision')?.progress).toBe(50);

    // Complete task-d2
    items = items.map((i) => (i.id === 'task-d2' ? { ...i, status: 'done' } : i));
    calc = calculateAllItemsProgress(items);

    expect(calc.get('1y-goal')?.progress).toBe(100);
    expect(calc.get('5y-vision')?.progress).toBe(100);
  });
});

