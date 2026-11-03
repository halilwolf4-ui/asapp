import { describe, it, expect } from 'vitest';
import { calculateAllItemsProgress } from './progressCalculator';
import { Item } from '../types';

describe('Progress Calculator - Automatic Child-Driven Engine', () => {
  it('ignores manualProgress on parent items and strictly computes from children', () => {
    const items: Item[] = [
      {
        id: 'parent-1',
        title: 'Parent Goal',
        horizon: 'year',
        startDate: '2026-01-01',
        status: 'todo',
        manualProgress: 95, // This MUST be ignored because it has children!
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      // 4 child items: 2 done (100%), 2 todo (0%)
      {
        id: 'c1',
        parentId: 'parent-1',
        title: 'Sub 1',
        horizon: 'month',
        startDate: '2026-01-01',
        status: 'done',
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c2',
        parentId: 'parent-1',
        title: 'Sub 2',
        horizon: 'month',
        startDate: '2026-02-01',
        status: 'done',
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c3',
        parentId: 'parent-1',
        title: 'Sub 3',
        horizon: 'month',
        startDate: '2026-03-01',
        status: 'todo',
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'c4',
        parentId: 'parent-1',
        title: 'Sub 4',
        horizon: 'month',
        startDate: '2026-04-01',
        status: 'todo',
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    const result = calculateAllItemsProgress(items);
    const parentCalc = result.get('parent-1');

    // (100 + 100 + 0 + 0) / 4 = 50%
    expect(parentCalc?.progress).toBe(50);
    expect(parentCalc?.isLeaf).toBe(false);
    expect(parentCalc?.derivedStatus).toBe('in_progress');
    expect(parentCalc?.childrenCount).toBe(4);
    expect(parentCalc?.completedChildrenCount).toBe(2);
  });

  it('respects manualProgress and status on leaf items without children', () => {
    const items: Item[] = [
      {
        id: 'leaf-done',
        title: 'Leaf Done',
        horizon: 'month',
        startDate: '2026-11-01',
        status: 'done',
        manualProgress: 30, // Status 'done' overrides manualProgress to 100%
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
      },
      {
        id: 'leaf-slider',
        title: 'Leaf Slider',
        horizon: 'month',
        startDate: '2026-11-01',
        status: 'in_progress',
        manualProgress: 65, // Active slider value
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
      },
    ];

    const result = calculateAllItemsProgress(items);
    expect(result.get('leaf-done')?.progress).toBe(100);
    expect(result.get('leaf-done')?.isLeaf).toBe(true);

    expect(result.get('leaf-slider')?.progress).toBe(65);
    expect(result.get('leaf-slider')?.isLeaf).toBe(true);
  });

  it('spreads progress across 3+ level hierarchy: 5-Year -> Year -> Month -> Week -> Day', () => {
    const items: Item[] = [
      {
        id: '5y',
        title: '5 Year',
        horizon: 'fiveYear',
        startDate: '2026-01-01',
        status: 'todo',
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: '1y',
        parentId: '5y',
        title: '1 Year',
        horizon: 'year',
        startDate: '2026-01-01',
        status: 'todo',
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: '1m',
        parentId: '1y',
        title: '1 Month',
        horizon: 'month',
        startDate: '2026-11-01',
        status: 'todo',
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
      },
      {
        id: '1w',
        parentId: '1m',
        title: '1 Week',
        horizon: 'week',
        startDate: '2026-11-03',
        status: 'todo',
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-11-03',
        updatedAt: '2026-11-03',
      },
      // 2 days under 1w: 1 done, 1 todo
      {
        id: 'd1',
        parentId: '1w',
        title: 'Day 1',
        horizon: 'day',
        startDate: '2026-11-03',
        status: 'done',
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-11-03',
        updatedAt: '2026-11-03',
      },
      {
        id: 'd2',
        parentId: '1w',
        title: 'Day 2',
        horizon: 'day',
        startDate: '2026-11-04',
        status: 'todo',
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-11-03',
        updatedAt: '2026-11-03',
      },
    ];

    const result = calculateAllItemsProgress(items);
    // d1: 100%, d2: 0% -> 1w = 50%
    expect(result.get('1w')?.progress).toBe(50);
    // 1m has only 1w (50%) -> 1m = 50%
    expect(result.get('1m')?.progress).toBe(50);
    // 1y has only 1m (50%) -> 1y = 50%
    expect(result.get('1y')?.progress).toBe(50);
    // 5y has only 1y (50%) -> 5y = 50%
    expect(result.get('5y')?.progress).toBe(50);
  });

  it('recalculates cleanly when sub-goals are added or deleted', () => {
    let items: Item[] = [
      {
        id: 'goal',
        title: 'Goal',
        horizon: 'month',
        startDate: '2026-11-01',
        status: 'todo',
        priority: 'high',
        categoryId: 'career',
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
      },
      {
        id: 'sub1',
        parentId: 'goal',
        title: 'Sub 1',
        horizon: 'week',
        startDate: '2026-11-01',
        status: 'done', // 100%
        priority: 'medium',
        categoryId: 'career',
        createdAt: '2026-11-01',
        updatedAt: '2026-11-01',
      },
    ];

    // Single child done -> 100%
    let result = calculateAllItemsProgress(items);
    expect(result.get('goal')?.progress).toBe(100);

    // Add a new todo sub-goal
    items.push({
      id: 'sub2',
      parentId: 'goal',
      title: 'Sub 2',
      horizon: 'week',
      startDate: '2026-11-08',
      status: 'todo', // 0%
      priority: 'medium',
      categoryId: 'career',
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01',
    });

    result = calculateAllItemsProgress(items);
    // 100 + 0 / 2 = 50%
    expect(result.get('goal')?.progress).toBe(50);

    // Delete sub1
    items = items.filter((i) => i.id !== 'sub1');
    result = calculateAllItemsProgress(items);
    // Only sub2 (0%) remains -> 0%
    expect(result.get('goal')?.progress).toBe(0);
  });
});
