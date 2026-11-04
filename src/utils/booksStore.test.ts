import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from '../store/usePlannerStore';
import { storageRepo } from '../services/storage/storageRepository';

describe('Books and Quotes in usePlannerStore', () => {
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
      books: [],
      items: [],
      isBookModalOpen: false,
      editingBook: null,
    });
  });

  it('adds a new book with notes and quotes', async () => {
    const store = usePlannerStore.getState();
    await store.addBook({
      title: 'Dostluk Üzerine',
      author: 'Cicero',
      totalPages: 110,
      status: 'read',
      completedDate: '2026-04-10',
      rating: 5,
      genre: 'Felsefe',
      notes: 'Gerçek dostluğun erdem üzerine kurulduğu vurgulanıyor.',
      quotes: [
        { id: 'q-1', text: 'Dostluk hayatın tuzudur.', page: 22 },
      ],
    });

    const books = usePlannerStore.getState().books;
    expect(books.length).toBe(1);
    expect(books[0].title).toBe('Dostluk Üzerine');
    expect(books[0].quotes.length).toBe(1);
    expect(books[0].quotes[0].text).toBe('Dostluk hayatın tuzudur.');
  });

  it('adds and deletes inline quotes from an existing book', async () => {
    const store = usePlannerStore.getState();
    await store.addBook({
      title: 'İçsel Huzur',
      author: 'Seneca',
      totalPages: 160,
      status: 'read',
      quotes: [],
    });

    const bookId = usePlannerStore.getState().books[0].id;

    // Add inline quote
    await store.addQuoteToBook(bookId, {
      text: 'Hayat bir tiyatro gibidir, ne kadar uzun olduğu değil ne kadar iyi oynandığı önemlidir.',
      page: 45,
    });

    let book = usePlannerStore.getState().books.find((b) => b.id === bookId);
    expect(book?.quotes.length).toBe(1);
    expect(book?.quotes[0].page).toBe(45);

    // Delete quote
    const quoteId = book!.quotes[0].id;
    await store.deleteQuoteFromBook(bookId, quoteId);

    book = usePlannerStore.getState().books.find((b) => b.id === bookId);
    expect(book?.quotes.length).toBe(0);
  });
});

