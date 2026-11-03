import { Item, CalculatedItem, ItemStatus } from '../types';

/**
 * Calculates progress and derived status for all items in a hierarchical tree.
 * 
 * Rules:
 * a) IF AN ITEM HAS CHILDREN (sub-goals):
 *    - Progress is ALWAYS automatically calculated from children's progress (average).
 *    - Any manualProgress on this item is explicitly ignored.
 *    - Status is derived:
 *        - 100% -> 'done'
 *        - >0%  -> 'in_progress'
 *        - 0%   -> 'todo'
 * 
 * b) IF AN ITEM HAS NO CHILDREN (leaf item):
 *    - 'done' -> 100%
 *    - 'in_progress' -> manualProgress ?? 50%
 *    - 'todo' -> manualProgress ?? 0%
 *    - derivedStatus = item.status
 */
export function calculateAllItemsProgress(items: Item[]): Map<string, CalculatedItem> {
  const itemMap = new Map<string, Item>();
  const childrenMap = new Map<string, string[]>();

  // Initialize maps
  for (const item of items) {
    itemMap.set(item.id, item);
    if (!childrenMap.has(item.id)) {
      childrenMap.set(item.id, []);
    }
    if (item.parentId) {
      const list = childrenMap.get(item.parentId) || [];
      list.push(item.id);
      childrenMap.set(item.parentId, list);
    }
  }

  const memo = new Map<string, CalculatedItem>();
  const visiting = new Set<string>();

  function calculate(itemId: string): CalculatedItem {
    if (memo.has(itemId)) {
      return memo.get(itemId)!;
    }

    const item = itemMap.get(itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    // Cycle detection guard
    if (visiting.has(itemId)) {
      const isLeaf = (childrenMap.get(itemId) || []).length === 0;
      const fallback: CalculatedItem = {
        ...item,
        progress: item.status === 'done' ? 100 : (item.manualProgress ?? 0),
        childrenCount: 0,
        completedChildrenCount: 0,
        isLeaf,
        derivedStatus: item.status,
      };
      return fallback;
    }

    visiting.add(itemId);

    const childIds = childrenMap.get(itemId) || [];
    let progress = 0;
    let completedChildrenCount = 0;
    const computedChildren: CalculatedItem[] = [];
    const isLeaf = childIds.length === 0;
    let derivedStatus: ItemStatus = item.status;

    if (!isLeaf) {
      // Parent with children: manualProgress is IGNORED completely
      let totalChildProgress = 0;
      for (const cId of childIds) {
        if (itemMap.has(cId)) {
          const childCalc = calculate(cId);
          computedChildren.push(childCalc);
          totalChildProgress += childCalc.progress;
          if (childCalc.progress === 100 || childCalc.derivedStatus === 'done') {
            completedChildrenCount++;
          }
        }
      }

      progress = Math.round(totalChildProgress / childIds.length);
      progress = Math.max(0, Math.min(100, progress));

      // Derive status from children completion
      if (progress === 100 && completedChildrenCount === childIds.length) {
        derivedStatus = 'done';
      } else if (progress > 0 || completedChildrenCount > 0) {
        derivedStatus = 'in_progress';
      } else {
        derivedStatus = 'todo';
      }
    } else {
      // Leaf item: user can set manualProgress or mark as done
      if (item.status === 'done') {
        progress = 100;
        derivedStatus = 'done';
      } else if (item.status === 'in_progress') {
        progress = typeof item.manualProgress === 'number' ? item.manualProgress : 50;
        derivedStatus = 'in_progress';
      } else {
        progress = typeof item.manualProgress === 'number' ? item.manualProgress : 0;
        derivedStatus = 'todo';
      }
    }

    const calculated: CalculatedItem = {
      ...item,
      progress,
      childrenCount: childIds.length,
      completedChildrenCount,
      isLeaf,
      derivedStatus,
      children: computedChildren,
    };

    visiting.delete(itemId);
    memo.set(itemId, calculated);
    return calculated;
  }

  for (const item of items) {
    if (!memo.has(item.id)) {
      calculate(item.id);
    }
  }

  return memo;
}

/**
 * Builds root-level hierarchical tree of items
 */
export function buildHierarchyTree(items: Item[]): CalculatedItem[] {
  const calcMap = calculateAllItemsProgress(items);
  const roots: CalculatedItem[] = [];

  for (const item of items) {
    if (!item.parentId || !calcMap.has(item.parentId)) {
      const calc = calcMap.get(item.id);
      if (calc) {
        roots.push(calc);
      }
    }
  }

  // Sort by horizon: fiveYear -> year -> month -> week -> day
  const horizonOrder: Record<string, number> = {
    fiveYear: 1,
    year: 2,
    month: 3,
    week: 4,
    day: 5,
  };

  return roots.sort((a, b) => (horizonOrder[a.horizon] ?? 99) - (horizonOrder[b.horizon] ?? 99));
}
