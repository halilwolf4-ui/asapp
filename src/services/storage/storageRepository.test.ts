import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository } from './storageRepository';

describe('LocalStorageRepository Migration', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
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
  });

  it('migrates legacy odak_ keys to asapp: keys automatically without data loss', async () => {
    const sampleItems = [{ id: '1', title: 'Legacy Item', horizon: 'day' }];
    localStorage.setItem('odak_items_v1', JSON.stringify(sampleItems));
    localStorage.setItem('odak_quote_v1', 'Legacy Quote');

    const repo = new LocalStorageRepository();
    const items = await repo.getItems();
    const quote = await repo.getQuote();

    expect(items).toEqual(sampleItems);
    expect(quote).toBe('Legacy Quote');
    expect(localStorage.getItem('asapp:items')).toBe(JSON.stringify(sampleItems));
    expect(localStorage.getItem('asapp:quote')).toBe('Legacy Quote');
  });
});
