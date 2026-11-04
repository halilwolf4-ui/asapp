import { Item, Category, Book } from '../../types';

export interface StorageRepository {
  getItems(): Promise<Item[]>;
  saveItems(items: Item[]): Promise<void>;
  getCategories(): Promise<Category[]>;
  saveCategories(categories: Category[]): Promise<void>;
  getQuote(): Promise<string>;
  saveQuote(quote: string): Promise<void>;
  getBooks(): Promise<Book[]>;
  saveBooks(books: Book[]): Promise<void>;
  exportData(): Promise<string>;
  importData(jsonData: string): Promise<boolean>;
  clearAll(): Promise<void>;
}

const ITEMS_KEY = 'asapp:items';
const CATEGORIES_KEY = 'asapp:categories';
const QUOTE_KEY = 'asapp:quote';
const BOOKS_KEY = 'asapp:books';

// Legacy keys for automatic migration
const LEGACY_ITEMS_KEY = 'odak_items_v1';
const LEGACY_CATEGORIES_KEY = 'odak_categories_v1';
const LEGACY_QUOTE_KEY = 'odak_quote_v1';

export class LocalStorageRepository implements StorageRepository {
  constructor() {
    this.migrateLegacyKeys();
  }

  /**
   * Automatically migrates legacy 'odak' keys to new 'asapp:' keys
   * ensuring users never lose their saved items.
   */
  private migrateLegacyKeys(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      // Migrate items if new key does not exist yet
      if (!localStorage.getItem(ITEMS_KEY) && localStorage.getItem(LEGACY_ITEMS_KEY)) {
        const legacyItems = localStorage.getItem(LEGACY_ITEMS_KEY);
        if (legacyItems) {
          localStorage.setItem(ITEMS_KEY, legacyItems);
        }
      }

      // Migrate categories
      if (!localStorage.getItem(CATEGORIES_KEY) && localStorage.getItem(LEGACY_CATEGORIES_KEY)) {
        const legacyCategories = localStorage.getItem(LEGACY_CATEGORIES_KEY);
        if (legacyCategories) {
          localStorage.setItem(CATEGORIES_KEY, legacyCategories);
        }
      }

      // Migrate quote
      if (!localStorage.getItem(QUOTE_KEY) && localStorage.getItem(LEGACY_QUOTE_KEY)) {
        const legacyQuote = localStorage.getItem(LEGACY_QUOTE_KEY);
        if (legacyQuote) {
          localStorage.setItem(QUOTE_KEY, legacyQuote);
        }
      }
    } catch (e) {
      console.warn('Could not run localStorage migration:', e);
    }
  }

  async getItems(): Promise<Item[]> {
    try {
      this.migrateLegacyKeys();
      const data = localStorage.getItem(ITEMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load items from localStorage', e);
      return [];
    }
  }

  async saveItems(items: Item[]): Promise<void> {
    try {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save items to localStorage', e);
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      this.migrateLegacyKeys();
      const data = localStorage.getItem(CATEGORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load categories', e);
      return [];
    }
  }

  async saveCategories(categories: Category[]): Promise<void> {
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  }

  async getQuote(): Promise<string> {
    this.migrateLegacyKeys();
    return localStorage.getItem(QUOTE_KEY) || 'Küçük adımlar, büyük vizyonların temelidir.';
  }

  async saveQuote(quote: string): Promise<void> {
    localStorage.setItem(QUOTE_KEY, quote);
  }

  async getBooks(): Promise<Book[]> {
    this.migrateLegacyKeys();
    const data = localStorage.getItem(BOOKS_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveBooks(books: Book[]): Promise<void> {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }

  async exportData(): Promise<string> {
    const items = await this.getItems();
    const categories = await this.getCategories();
    const quote = await this.getQuote();
    const books = await this.getBooks();
    return JSON.stringify({ items, categories, quote, books, exportedAt: new Date().toISOString() }, null, 2);
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed.items)) {
        await this.saveItems(parsed.items);
      }
      if (Array.isArray(parsed.categories)) {
        await this.saveCategories(parsed.categories);
      }
      if (typeof parsed.quote === 'string') {
        await this.saveQuote(parsed.quote);
      }
      if (Array.isArray(parsed.books)) {
        await this.saveBooks(parsed.books);
      }
      return true;
    } catch (e) {
      console.error('Failed to import data', e);
      return false;
    }
  }

  async clearAll(): Promise<void> {
    localStorage.removeItem(ITEMS_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    localStorage.removeItem(QUOTE_KEY);
    localStorage.removeItem(BOOKS_KEY);
    localStorage.removeItem(LEGACY_ITEMS_KEY);
    localStorage.removeItem(LEGACY_CATEGORIES_KEY);
    localStorage.removeItem(LEGACY_QUOTE_KEY);
  }
}

export const storageRepo = new LocalStorageRepository();
