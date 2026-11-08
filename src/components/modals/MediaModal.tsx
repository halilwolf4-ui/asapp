import React, { useState, useEffect, useRef } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MediaType, MediaStatus } from '../../types';
import {
  X,
  Trash2,
  Star,
  Upload,
  Search,
  Loader2,
  Film,
  Tv,
} from 'lucide-react';
import { resizeImageToDataUrl, findMediaPoster } from '../../utils/imageUtils';

const POSTER_COLORS = [
  { label: 'Mor', color: '#8A4FFF' },
  { label: 'Pembe', color: '#FF3D7F' },
  { label: 'Nane Yeşili', color: '#2EE6B6' },
  { label: 'Altın Sarısı', color: '#FFB800' },
  { label: 'Mavi', color: '#3B82F6' },
  { label: 'Kızıl', color: '#E11D48' },
];

const GENRE_SUGGESTIONS = [
  'Aksiyon',
  'Bilim Kurgu',
  'Dram',
  'Komedi',
  'Gerilim',
  'Animasyon',
  'Suç',
  'Belgesel',
  'Fantastik',
  'Korku',
  'Macera',
  'Gizem',
  'Romantik',
];

export const MediaModal: React.FC = () => {
  const {
    isMediaModalOpen,
    editingMediaItem,
    closeMediaModal,
    addMediaItem,
    updateMediaItem,
    deleteMediaItem,
  } = usePlannerStore();

  const [type, setType] = useState<MediaType>('movie');
  const [title, setTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [director, setDirector] = useState('');
  const [year, setYear] = useState<string>('');
  const [genre, setGenre] = useState('Dram');
  const [status, setStatus] = useState<MediaStatus>('watched');
  const [rating, setRating] = useState<number>(5);
  const [watchedDate, setWatchedDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [runtimeMinutes, setRuntimeMinutes] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [posterColor, setPosterColor] = useState('#8A4FFF');
  const [posterUrl, setPosterUrl] = useState('');

  // Series specific
  const [totalSeasons, setTotalSeasons] = useState<string>('');
  const [currentSeason, setCurrentSeason] = useState<string>('');
  const [totalEpisodes, setTotalEpisodes] = useState<string>('');
  const [currentEpisode, setCurrentEpisode] = useState<string>('');
  const [episodeRuntimeMinutes, setEpisodeRuntimeMinutes] = useState<string>('');

  // Poster helpers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isFindingPoster, setIsFindingPoster] = useState(false);
  const [posterMessage, setPosterMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  useEffect(() => {
    if (editingMediaItem) {
      setType(editingMediaItem.type);
      setTitle(editingMediaItem.title);
      setOriginalTitle(editingMediaItem.originalTitle || '');
      setDirector(editingMediaItem.director || '');
      setYear(editingMediaItem.year ? String(editingMediaItem.year) : '');
      setGenre(editingMediaItem.genre || 'Dram');
      setStatus(editingMediaItem.status);
      setRating(editingMediaItem.rating || 5);
      setWatchedDate(editingMediaItem.watchedDate || '');
      setStartDate(editingMediaItem.startDate || '');
      setRuntimeMinutes(editingMediaItem.runtimeMinutes ? String(editingMediaItem.runtimeMinutes) : '');
      setNotes(editingMediaItem.notes || '');
      setPosterColor(editingMediaItem.posterColor || '#8A4FFF');
      setPosterUrl(editingMediaItem.posterUrl || '');

      setTotalSeasons(editingMediaItem.totalSeasons ? String(editingMediaItem.totalSeasons) : '');
      setCurrentSeason(editingMediaItem.currentSeason ? String(editingMediaItem.currentSeason) : '');
      setTotalEpisodes(editingMediaItem.totalEpisodes ? String(editingMediaItem.totalEpisodes) : '');
      setCurrentEpisode(editingMediaItem.currentEpisode ? String(editingMediaItem.currentEpisode) : '');
      setEpisodeRuntimeMinutes(editingMediaItem.episodeRuntimeMinutes ? String(editingMediaItem.episodeRuntimeMinutes) : '');
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setType('movie');
      setTitle('');
      setOriginalTitle('');
      setDirector('');
      setYear(String(new Date().getFullYear()));
      setGenre('Dram');
      setStatus('watched');
      setRating(5);
      setWatchedDate(today);
      setStartDate('');
      setRuntimeMinutes('');
      setNotes('');
      setPosterColor('#8A4FFF');
      setPosterUrl('');

      setTotalSeasons('');
      setCurrentSeason('');
      setTotalEpisodes('');
      setCurrentEpisode('');
      setEpisodeRuntimeMinutes('');
    }
    setPosterMessage(null);
    setQuotaError(null);
  }, [editingMediaItem, isMediaModalOpen]);

  if (!isMediaModalOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterMessage(null);
    setIsProcessingFile(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 240, 360);
      setPosterUrl(dataUrl);
      setPosterMessage({ text: 'Afiş görseli başarıyla yüklendi.', type: 'success' });
    } catch (err: any) {
      setPosterMessage({ text: err.message || 'Görsel işlenirken hata oluştu.', type: 'error' });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFindPoster = async () => {
    if (!title.trim()) {
      setPosterMessage({ text: 'Afiş aramak için önce yapım adını girin.', type: 'error' });
      return;
    }
    setPosterMessage(null);
    setIsFindingPoster(true);
    try {
      const result = await findMediaPoster(title, type, originalTitle);
      if (result) {
        setPosterUrl(result.posterUrl);

        // Fill empty fields without overwriting user entered data
        if (!year && result.year) setYear(String(result.year));
        if (!director && result.director) setDirector(result.director);
        if (!genre && result.genre) setGenre(result.genre);
        if (!runtimeMinutes && result.runtimeMinutes) setRuntimeMinutes(String(result.runtimeMinutes));

        setPosterMessage({ text: 'Afiş ve bilgiler başarıyla bulundu!', type: 'success' });
      } else {
        setPosterMessage({
          text: 'Afiş bulunamadı, dosya yükleyebilir veya link yapıştırabilirsin.',
          type: 'error',
        });
      }
    } catch {
      setPosterMessage({
        text: 'Arama sırasında hata oluştu. Link yapıştırabilir veya dosya seçebilirsin.',
        type: 'error',
      });
    } finally {
      setIsFindingPoster(false);
    }
  };

  const handleRemovePoster = () => {
    setPosterUrl('');
    setPosterMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setQuotaError(null);

    const payload = {
      type,
      title: title.trim(),
      originalTitle: originalTitle.trim() || undefined,
      director: director.trim() || undefined,
      year: year ? parseInt(year, 10) : undefined,
      genre: genre.trim() || 'Genel',
      status,
      rating,
      watchedDate:
        status === 'watched' || status === 'waiting_season'
          ? watchedDate || new Date().toISOString().slice(0, 10)
          : undefined,
      startDate: status === 'watching' ? startDate || undefined : undefined,
      runtimeMinutes: runtimeMinutes ? parseInt(runtimeMinutes, 10) : undefined,
      notes: notes.trim() || undefined,
      posterColor,
      posterUrl: posterUrl.trim() || undefined,

      totalSeasons: type === 'series' && totalSeasons ? parseInt(totalSeasons, 10) : undefined,
      currentSeason: type === 'series' && currentSeason ? parseInt(currentSeason, 10) : undefined,
      totalEpisodes: type === 'series' && totalEpisodes ? parseInt(totalEpisodes, 10) : undefined,
      currentEpisode: type === 'series' && currentEpisode ? parseInt(currentEpisode, 10) : undefined,
      episodeRuntimeMinutes: type === 'series' && episodeRuntimeMinutes ? parseInt(episodeRuntimeMinutes, 10) : undefined,
    };

    try {
      if (editingMediaItem) {
        await updateMediaItem(editingMediaItem.id, payload);
      } else {
        await addMediaItem(payload);
      }
    } catch (err: any) {
      console.error('Media save error:', err);
      if (
        err?.name === 'QuotaExceededError' ||
        err?.message?.includes('quota') ||
        err?.message?.includes('QuotaExceeded')
      ) {
        setQuotaError(
          'Tarayıcı hafıza sınırı aşıldı! Lütfen daha küçük bir afiş veya doğrudan web bağlantısı (URL) kullanın.'
        );
      } else {
        setQuotaError('Kayıt sırasında hata oluştu: ' + (err?.message || 'Bilinmeyen hata'));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet-p:p-6 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="bg-[#101744] border border-white/15 w-full max-w-xl rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden max-h-[92dvh] transition-all duration-200">
        {/* HEADER */}
        <div className="p-6 pb-4 border-b border-white/10 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.4)]"
              style={{ backgroundColor: posterColor }}
            />
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-accent-pink block mb-0.5">
                {editingMediaItem ? 'YAPIMI DÜZENLE' : 'YENİ FİLM VEYA DİZİ EKLE'}
              </span>
              <h2 className="text-2xl font-black font-display text-white tracking-tight">
                {editingMediaItem ? editingMediaItem.title : 'Film & Dizi Günlüğü'}
              </h2>
            </div>
          </div>

          <button
            onClick={closeMediaModal}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <form id="media-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* MediaType Selector: Film / Dizi */}
          <div>
            <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
              Yapım Türü
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('movie')}
                className={`min-h-[46px] py-2.5 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  type === 'movie'
                    ? 'bg-accent-pink text-white shadow-[0_0_16px_rgba(255,61,127,0.4)]'
                    : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Film</span>
              </button>
              <button
                type="button"
                onClick={() => setType('series')}
                className={`min-h-[46px] py-2.5 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  type === 'series'
                    ? 'bg-accent-pink text-white shadow-[0_0_16px_rgba(255,61,127,0.4)]'
                    : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>Dizi</span>
              </button>
            </div>
          </div>

          {/* Status Tabs: İzlendi / İzleniyor / Yeni Sezon Bekleniyor / İzlenecek */}
          <div>
            <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
              İzleme Durumu
            </label>
            <div className={`grid ${type === 'series' ? 'grid-cols-2 tablet-p:grid-cols-4' : 'grid-cols-3'} gap-2`}>
              {(
                type === 'series'
                  ? ([
                      { id: 'watched', label: 'Bitti / İzlendi' },
                      { id: 'watching', label: 'İzleniyor' },
                      { id: 'waiting_season', label: 'Yeni Sezon Bekleniyor' },
                      { id: 'to_watch', label: 'İzlenecek' },
                    ] as const)
                  : ([
                      { id: 'watched', label: 'İzlendi' },
                      { id: 'watching', label: 'İzleniyor' },
                      { id: 'to_watch', label: 'İzlenecek' },
                    ] as const)
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id)}
                  className={`min-h-[44px] py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center text-center ${
                    status === st.id
                      ? 'bg-accent-pink text-white shadow-[0_0_16px_rgba(255,61,127,0.4)]'
                      : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Original Title */}
          <div className="grid grid-cols-1 tablet-p:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                Başlık (Türkçe veya Genel Adı) *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Başlangıç (Inception)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white placeholder-text-muted/60 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                Orijinal Adı (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Örn: Inception"
                value={originalTitle}
                onChange={(e) => setOriginalTitle(e.target.value)}
                className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white placeholder-text-muted/60 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Director / Creator & Year */}
          <div className="grid grid-cols-1 tablet-p:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                {type === 'movie' ? 'Yönetmen' : 'Yaratıcı / Yönetmen'}
              </label>
              <input
                type="text"
                placeholder="Örn: Christopher Nolan"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white placeholder-text-muted/60 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                Çıkış Yılı
              </label>
              <input
                type="number"
                placeholder="Örn: 2010"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white placeholder-text-muted/60 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Genre & Rating */}
          <div className="grid grid-cols-1 tablet-p:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                Tür / Kategori
              </label>
              <input
                type="text"
                list="media-genres-list"
                placeholder="Örn: Bilim Kurgu"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white placeholder-text-muted/60 focus:outline-none transition-colors"
              />
              <datalist id="media-genres-list">
                {GENRE_SUGGESTIONS.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                Değerlendirme (Puan)
              </label>
              <div className="flex items-center gap-2 min-h-[46px]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-text-muted hover:text-accent-yellow transition-transform hover:scale-125"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'fill-accent-yellow text-accent-yellow drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]'
                          : 'text-white/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dates & Runtime */}
          <div className="grid grid-cols-1 tablet-p:grid-cols-2 gap-4">
            {status === 'watched' || status === 'waiting_season' ? (
              <div>
                <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                  {status === 'waiting_season' ? 'Son İzlenme Tarihi' : 'İzlenme Tarihi'}
                </label>
                <input
                  type="date"
                  value={watchedDate}
                  onChange={(e) => setWatchedDate(e.target.value)}
                  className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>
            ) : status === 'watching' ? (
              <div>
                <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                  Başlama Tarihi
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>
            ) : null}

            <div>
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                {type === 'movie' ? 'Film Süresi (Dakika)' : 'Bölüm Süresi (Dakika)'}
              </label>
              <input
                type="number"
                min="1"
                placeholder={type === 'movie' ? 'Örn: 148' : 'Örn: 50'}
                value={type === 'movie' ? runtimeMinutes : episodeRuntimeMinutes}
                onChange={(e) =>
                  type === 'movie'
                    ? setRuntimeMinutes(e.target.value)
                    : setEpisodeRuntimeMinutes(e.target.value)
                }
                className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Series Specific Progress Fields */}
          {type === 'series' && (
            <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/10 space-y-4">
              <span className="text-[10px] uppercase font-black text-accent-mint tracking-wider block">
                Dizi İlerleme Durumu
              </span>
              <div className="grid grid-cols-2 tablet-p:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">Mevcut Sezon</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Örn: 2"
                    value={currentSeason}
                    onChange={(e) => setCurrentSeason(e.target.value)}
                    className="w-full min-h-[40px] bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">Toplam Sezon</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Örn: 5"
                    value={totalSeasons}
                    onChange={(e) => setTotalSeasons(e.target.value)}
                    className="w-full min-h-[40px] bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">Mevcut Bölüm</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Örn: 8"
                    value={currentEpisode}
                    onChange={(e) => setCurrentEpisode(e.target.value)}
                    className="w-full min-h-[40px] bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">Toplam Bölüm</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Örn: 60"
                    value={totalEpisodes}
                    onChange={(e) => setTotalEpisodes(e.target.value)}
                    className="w-full min-h-[40px] bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Poster Section (3 Methods) */}
          <div className="space-y-3">
            <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block">
              Afiş Görseli
            </label>

            <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-white/[0.025] border border-white/10">
              {/* Preview Box */}
              <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.4)] relative flex items-center justify-center bg-black/30 aspect-[2/3]">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt="Afiş Önizleme"
                    className="w-full h-full object-cover"
                    onError={() => {
                      setPosterMessage({
                        text: 'Afiş bağlantısı yüklenemedi. Lütfen kontrol edin.',
                        type: 'error',
                      });
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col justify-between p-2"
                    style={{ background: `linear-gradient(135deg, ${posterColor}, ${posterColor}88)` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    {type === 'movie' ? (
                      <Film className="w-4 h-4 text-white/90 self-end" />
                    ) : (
                      <Tv className="w-4 h-4 text-white/90 self-end" />
                    )}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Method A: Upload */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingFile || isFindingPoster}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isProcessingFile ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Dosya Seç</span>
                  </button>

                  {/* Method C: Find Poster */}
                  <button
                    type="button"
                    onClick={handleFindPoster}
                    disabled={!title.trim() || isFindingPoster || isProcessingFile}
                    title={!title.trim() ? 'Aramak için önce yapım adını girin' : 'Afiş ve bilgileri otomatik bul'}
                    className="px-3.5 py-2 rounded-xl bg-accent-pink/20 hover:bg-accent-pink/30 text-accent-pink text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {isFindingPoster ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Afiş Bul</span>
                  </button>

                  {/* Remove */}
                  {posterUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePoster}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-accent-coral/20 text-accent-coral text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Kaldır</span>
                    </button>
                  )}
                </div>

                {/* Method B: URL input */}
                <div>
                  <input
                    type="url"
                    placeholder="https://... afiş görsel bağlantısı yapıştırın"
                    value={posterUrl.startsWith('data:') ? '' : posterUrl}
                    onChange={(e) => {
                      setPosterUrl(e.target.value.trim());
                      setPosterMessage(null);
                    }}
                    className="w-full min-h-[38px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-xl px-3 py-1.5 text-xs text-white placeholder-text-muted/60 focus:outline-none transition-colors"
                  />
                  {posterUrl.startsWith('data:') && (
                    <span className="text-[11px] text-accent-mint font-semibold block mt-1">
                      ✓ Cihazdan / aramadan yüklenmiş görsel aktif
                    </span>
                  )}
                </div>

                {posterMessage && (
                  <p
                    className={`text-xs font-medium ${
                      posterMessage.type === 'error' ? 'text-accent-coral' : 'text-accent-mint'
                    }`}
                  >
                    {posterMessage.text}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Theme Poster Color Picker */}
          <div>
            <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
              Afiş Yokken Arka Plan Rengi
            </label>
            <div className="flex items-center gap-3">
              {POSTER_COLORS.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setPosterColor(c.color)}
                  className={`w-9 h-9 rounded-2xl transition-all flex items-center justify-center ${
                    posterColor === c.color
                      ? 'ring-2 ring-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
              Kişisel İnceleme & Notlar
            </label>
            <textarea
              rows={3}
              placeholder="Film veya dizi hakkında düşüncelerin, beğendiğin sahneler ya da hatırlamak istediğin detaylar..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none transition-colors"
            />
          </div>

          {quotaError && (
            <div className="p-3.5 rounded-2xl bg-accent-coral/15 border border-accent-coral/30 text-accent-coral text-xs font-bold animate-in fade-in">
              {quotaError}
            </div>
          )}
        </form>

        {/* FOOTER */}
        <div className="p-4 px-6 border-t border-white/10 bg-[#0E143E] shrink-0 flex items-center justify-between gap-4">
          {editingMediaItem ? (
            <button
              type="button"
              onClick={() => {
                deleteMediaItem(editingMediaItem.id);
                closeMediaModal();
              }}
              className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-accent-coral/20 text-accent-coral font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Sil</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeMediaModal}
              className="min-h-[46px] px-5 py-2.5 rounded-2xl border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              form="media-form"
              className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-gradient-to-r from-accent-pink to-[#FF5E8E] text-white font-black text-xs uppercase tracking-wider shadow-[0_8px_24px_rgba(255,61,127,0.35)] hover:shadow-[0_12px_32px_rgba(255,61,127,0.5)] active:scale-95 transition-all"
            >
              {editingMediaItem ? 'Kaydet' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

