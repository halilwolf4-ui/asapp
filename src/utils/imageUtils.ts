/**
 * Image resizing and book cover discovery utilities.
 */

/**
 * Resizes an image file/blob to a compact data URL using HTMLCanvasElement.
 * Keeps aspect ratio and caps size to avoid localStorage quota issues.
 */
export async function resizeImageToDataUrl(
  file: File | Blob,
  maxWidth = 240,
  maxHeight = 340,
  quality = 0.75
): Promise<string> {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Lütfen geçerli bir görsel dosyası seçin (PNG, JPEG, WebP vb.).');
  }

  // Load image
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Görsel dosyası okunamadı veya bozuk.'));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  // Calculate constrained dimensions preserving aspect ratio
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width <= 0 || height <= 0) {
    throw new Error('Geçersiz görsel boyutları.');
  }

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas bağlamı oluşturulamadı.');
  }

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Try WebP first, fallback to JPEG
  let currentQuality = quality;
  let dataUrl = canvas.toDataURL('image/webp', currentQuality);
  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
  }

  // If size exceeds ~130 KB (~100 KB binary equivalent), reduce quality
  while (dataUrl.length > 130000 && currentQuality > 0.35) {
    currentQuality -= 0.15;
    const format = dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
    dataUrl = canvas.toDataURL(format, currentQuality);
  }

  return dataUrl;
}

/**
 * Searches for a book cover using Google Books API with Open Library as fallback.
 * Attempts to convert the cover to a compressed data URL to avoid CORS or dead external links,
 * but falls back to the direct HTTPS URL if fetching fails.
 */
export async function findBookCover(title: string, author: string): Promise<string | null> {
  const cleanTitle = title.trim();
  const cleanAuthor = author.trim();

  if (!cleanTitle) return null;

  let candidateUrl: string | null = null;

  // 1. Google Books API
  try {
    const qParts: string[] = [`intitle:${encodeURIComponent(cleanTitle)}`];
    if (cleanAuthor) {
      qParts.push(`inauthor:${encodeURIComponent(cleanAuthor)}`);
    }
    const gBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${qParts.join('+')}&maxResults=5`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(gBooksUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items)) {
        for (const item of data.items) {
          const links = item.volumeInfo?.imageLinks;
          if (links) {
            let thumb =
              links.extraLarge ||
              links.large ||
              links.medium ||
              links.thumbnail ||
              links.smallThumbnail;
            if (thumb) {
              if (thumb.startsWith('http://')) {
                thumb = 'https://' + thumb.slice(7);
              }
              // Clean curl edge parameter and try to request larger zoom if present
              candidateUrl = thumb.replace('&edge=curl', '');
              break;
            }
          }
        }
      }
    }
  } catch (err) {
    // Network or abort error, proceed to fallback
  }

  // 2. Open Library Search API fallback
  if (!candidateUrl) {
    try {
      const params = new URLSearchParams({
        title: cleanTitle,
        limit: '5',
      });
      if (cleanAuthor) {
        params.append('author', cleanAuthor);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.docs)) {
          for (const doc of data.docs) {
            if (doc.cover_i) {
              candidateUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
              break;
            }
          }
        }
      }
    } catch (err) {
      // Network or abort error
    }
  }

  if (!candidateUrl) {
    return null;
  }

  // Attempt to fetch and compress image locally
  try {
    const imgRes = await fetch(candidateUrl);
    if (imgRes.ok) {
      const blob = await imgRes.blob();
      if (blob.type.startsWith('image/')) {
        return await resizeImageToDataUrl(blob);
      }
    }
  } catch {
    // If CORS prevents direct fetch, return candidate URL directly
  }

  return candidateUrl;
}

export interface MediaPosterResult {
  posterUrl: string;
  year?: number;
  director?: string;
  genre?: string;
  runtimeMinutes?: number;
}

/**
 * Executes a JSONP request for iTunes Search API when direct fetch fails (e.g. CORS).
 */
function fetchItunesJsonp(url: string, timeoutMs = 6000): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      return reject(new Error('Browser environment required for JSONP'));
    }
    const callbackName = 'itunes_jsonp_' + Math.random().toString(36).substring(2, 9);
    const script = document.createElement('script');
    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}callback=${callbackName}`;

    let timer: any = null;
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete (window as any)[callbackName];
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('iTunes JSONP timeout'));
    }, timeoutMs);

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('iTunes JSONP script error'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Searches iTunes Search API with direct fetch first, then JSONP fallback.
 */
async function queryItunesMovie(term: string): Promise<any> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=movie&entity=movie&country=US&limit=5`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Direct fetch failed, fallback to JSONP
  }

  try {
    return await fetchItunesJsonp(url);
  } catch {
    return null;
  }
}

/**
 * Searches for movie / series poster and metadata.
 * Uses iTunes Search API for movies and TVMaze for series.
 */
export async function findMediaPoster(
  title: string,
  type: 'movie' | 'series',
  originalTitle?: string
): Promise<MediaPosterResult | null> {
  const titlesToTry: string[] = [];
  if (originalTitle?.trim()) titlesToTry.push(originalTitle.trim());
  if (title?.trim() && !titlesToTry.includes(title.trim())) titlesToTry.push(title.trim());

  if (titlesToTry.length === 0) return null;

  let rawResult: MediaPosterResult | null = null;

  if (type === 'movie') {
    // Try iTunes Search API
    for (const term of titlesToTry) {
      try {
        const data = await queryItunesMovie(term);
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          const item = data.results[0];
          let poster = item.artworkUrl100 || item.artworkUrl60;
          if (poster) {
            // Upgrade to high-res (e.g. 600x900)
            poster = poster.replace('100x100bb.jpg', '600x900bb.jpg').replace('100x100', '600x900');
            if (poster.startsWith('http://')) poster = 'https://' + poster.slice(7);

            let year: number | undefined;
            if (item.releaseDate) {
              const y = parseInt(item.releaseDate.slice(0, 4), 10);
              if (!isNaN(y)) year = y;
            }

            let runtimeMinutes: number | undefined;
            if (item.trackTimeMillis) {
              runtimeMinutes = Math.round(item.trackTimeMillis / 60000);
            }

            rawResult = {
              posterUrl: poster,
              year,
              director: item.artistName || undefined,
              genre: item.primaryGenreName || undefined,
              runtimeMinutes,
            };
            break;
          }
        }
      } catch {
        // try next title
      }
    }
  } else {
    // type === 'series': Try TVMaze API
    for (const term of titlesToTry) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          const show = await res.json();
          let poster = show.image?.original || show.image?.medium;
          if (poster) {
            if (poster.startsWith('http://')) poster = 'https://' + poster.slice(7);

            let year: number | undefined;
            if (show.premiered) {
              const y = parseInt(show.premiered.slice(0, 4), 10);
              if (!isNaN(y)) year = y;
            }

            const genre = Array.isArray(show.genres) && show.genres.length > 0 ? show.genres[0] : undefined;
            const runtimeMinutes = show.averageRuntime || show.runtime || undefined;

            rawResult = {
              posterUrl: poster,
              year,
              genre,
              runtimeMinutes,
            };
            break;
          }
        }
      } catch {
        // try next
      }
    }
  }

  if (!rawResult || !rawResult.posterUrl) {
    return null;
  }

  // Attempt to fetch and compress image locally to avoid CORS / dead links
  try {
    const imgRes = await fetch(rawResult.posterUrl);
    if (imgRes.ok) {
      const blob = await imgRes.blob();
      if (blob.type.startsWith('image/')) {
        const compact = await resizeImageToDataUrl(blob, 240, 360);
        rawResult.posterUrl = compact;
      }
    }
  } catch {
    // If fetch fails (CORS), keep direct HTTPS URL
  }

  return rawResult;
}


