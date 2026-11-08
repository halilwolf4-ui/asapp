import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from '../store/usePlannerStore';
import { storageRepo } from '../services/storage/storageRepository';

describe('Media in usePlannerStore', () => {
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
      mediaItems: [],
      books: [],
      items: [],
      isMediaModalOpen: false,
      editingMediaItem: null,
    });
  });

  it('adds, updates and deletes a movie without posterUrl', async () => {
    const store = usePlannerStore.getState();

    // 1. Add
    await store.addMediaItem({
      type: 'movie',
      title: 'Interstellar',
      director: 'Christopher Nolan',
      year: 2014,
      genre: 'Bilim Kurgu',
      status: 'watched',
      watchedDate: '2026-05-15',
      rating: 5,
      runtimeMinutes: 169,
      notes: 'Zaman ve sevgi üzerine muazzam bir bilim kurgu.',
    });

    let media = usePlannerStore.getState().mediaItems;
    expect(media.length).toBe(1);
    expect(media[0].title).toBe('Interstellar');
    expect(media[0].posterUrl).toBeUndefined();
    expect(media[0].runtimeMinutes).toBe(169);

    const mediaId = media[0].id;

    // 2. Update
    await store.updateMediaItem(mediaId, {
      rating: 4,
      notes: 'İkinci izleyişimde daha da etkilendim.',
    });

    media = usePlannerStore.getState().mediaItems;
    expect(media[0].rating).toBe(4);
    expect(media[0].notes).toBe('İkinci izleyişimde daha da etkilendim.');

    // 3. Delete
    await store.deleteMediaItem(mediaId);
    media = usePlannerStore.getState().mediaItems;
    expect(media.length).toBe(0);
  });

  it('adds and updates series with posterUrl and progress fields', async () => {
    const store = usePlannerStore.getState();
    const poster = 'https://example.com/poster.jpg';

    await store.addMediaItem({
      type: 'series',
      title: 'Succession',
      status: 'watching',
      posterUrl: poster,
      totalSeasons: 4,
      currentSeason: 2,
      totalEpisodes: 39,
      currentEpisode: 6,
      episodeRuntimeMinutes: 60,
    });

    let media = usePlannerStore.getState().mediaItems;
    expect(media.length).toBe(1);
    expect(media[0].posterUrl).toBe(poster);
    expect(media[0].currentSeason).toBe(2);
    expect(media[0].currentEpisode).toBe(6);

    const mediaId = media[0].id;
    const newPoster = 'data:image/webp;base64,compactPosterData';
    await store.updateMediaItem(mediaId, {
      currentEpisode: 7,
      posterUrl: newPoster,
    });

    media = usePlannerStore.getState().mediaItems;
    expect(media[0].currentEpisode).toBe(7);
    expect(media[0].posterUrl).toBe(newPoster);
  });

  it('imports legacy backup JSON without media field gracefully', async () => {
    const legacyBackup = JSON.stringify({
      items: [],
      categories: [],
      quote: 'Örnek alıntı',
      books: [],
      exportedAt: '2026-01-01T00:00:00.000Z',
    });

    const store = usePlannerStore.getState();
    const success = await store.importBackup(legacyBackup);
    expect(success).toBe(true);

    const media = usePlannerStore.getState().mediaItems;
    expect(media).toEqual([]);
  });

  it('exports and imports backup JSON with media included', async () => {
    const store = usePlannerStore.getState();
    await store.addMediaItem({
      type: 'movie',
      title: 'Dune: Part Two',
      status: 'watched',
      year: 2024,
    });

    const exportedJson = await store.exportBackup();
    const parsed = JSON.parse(exportedJson);
    expect(Array.isArray(parsed.media)).toBe(true);
    expect(parsed.media.length).toBe(1);
    expect(parsed.media[0].title).toBe('Dune: Part Two');

    // Clear and import back
    await storageRepo.clearAll();
    usePlannerStore.setState({ mediaItems: [] });

    await store.importBackup(exportedJson);
    const restored = usePlannerStore.getState().mediaItems;
    expect(restored.length).toBe(1);
    expect(restored[0].title).toBe('Dune: Part Two');
  });
});

