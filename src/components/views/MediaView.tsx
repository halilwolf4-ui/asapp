import React, { useState, useMemo } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { MediaItem } from '../../types';
import {
  Film,
  Tv,
  Plus,
  Star,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Filter,
  Layers,
  List,
} from 'lucide-react';

export const MediaView: React.FC = () => {
  const {
    mediaItems,
    openCreateMediaModal,
    openEditMediaModal,
    deleteMediaItem,
  } = usePlannerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'watched' | 'watching' | 'waiting_season' | 'to_watch'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'flat' | 'byYear'>('flat');
  const [expandedMediaIds, setExpandedMediaIds] = useState<Set<string>>(new Set());
  const [failedPosterIds, setFailedPosterIds] = useState<Set<string>>(new Set());

  const currentYear = new Date().getFullYear();

  // STATS
  const stats = useMemo(() => {
    const watchedItems = mediaItems.filter((m) => m.status === 'watched');

    // This year watched movies
    const thisYearMovies = watchedItems.filter((m) => {
      if (m.type !== 'movie' || !m.watchedDate) return false;
      return new Date(m.watchedDate).getFullYear() === currentYear;
    });

    // This year completed series
    const thisYearSeries = watchedItems.filter((m) => {
      if (m.type !== 'series' || !m.watchedDate) return false;
      return new Date(m.watchedDate).getFullYear() === currentYear;
    });

    // Total watched count (all time)
    const allTimeCount = watchedItems.length;

    // Total watch duration (Minutes -> Hours & Minutes)
    let totalMinutes = 0;
    mediaItems.forEach((m) => {
      if (m.status === 'to_watch') return;

      if (m.type === 'movie') {
        if (m.status === 'watched' && m.runtimeMinutes) {
          totalMinutes += m.runtimeMinutes;
        }
      } else {
        // Series
        const epRuntime = m.episodeRuntimeMinutes || m.runtimeMinutes || 0;
        const watchedEpisodes =
          m.status === 'watched' || m.status === 'waiting_season'
            ? m.totalEpisodes || (m.totalSeasons ? m.totalSeasons * 10 : 0)
            : m.currentEpisode || 0;
        totalMinutes += watchedEpisodes * epRuntime;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const durationFormatted = hours > 0 ? `${hours} sa ${mins} dk` : `${mins} dk`;

    return {
      thisYearMoviesCount: thisYearMovies.length,
      thisYearSeriesCount: thisYearSeries.length,
      allTimeCount,
      durationFormatted,
    };
  }, [mediaItems, currentYear]);

  // Unique genres
  const genres = useMemo(() => {
    const gSet = new Set<string>();
    mediaItems.forEach((m) => {
      if (m.genre) gSet.add(m.genre);
    });
    return Array.from(gSet);
  }, [mediaItems]);

  // Filtered items
  const filteredMedia = useMemo(() => {
    return mediaItems.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (selectedGenre !== 'all' && item.genre !== selectedGenre) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesOriginal = item.originalTitle?.toLowerCase().includes(q);
        const matchesDirector = item.director?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesOriginal && !matchesDirector && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [mediaItems, statusFilter, typeFilter, selectedGenre, searchQuery]);

  // Grouped by year for 'byYear' display mode
  const mediaByYear = useMemo(() => {
    const groups: { [year: string]: MediaItem[] } = {};
    const noDateKey = 'Tarihsiz';

    filteredMedia.forEach((item) => {
      let y = noDateKey;
      if (item.watchedDate) {
        y = item.watchedDate.slice(0, 4);
      } else if (item.year) {
        y = String(item.year);
      }
      if (!groups[y]) groups[y] = [];
      groups[y].push(item);
    });

    const sortedYears = Object.keys(groups).sort((a, b) => {
      if (a === noDateKey) return 1;
      if (b === noDateKey) return -1;
      return parseInt(b, 10) - parseInt(a, 10);
    });

    return sortedYears.map((year) => {
      const items = groups[year];
      const moviesCount = items.filter((i) => i.type === 'movie').length;
      const seriesCount = items.filter((i) => i.type === 'series').length;
      return {
        year,
        items,
        moviesCount,
        seriesCount,
      };
    });
  }, [filteredMedia]);

  const toggleExpand = (id: string) => {
    setExpandedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderMediaCard = (item: MediaItem) => {
    const isExpanded = expandedMediaIds.has(item.id);
    const posterBg = item.posterColor || '#8A4FFF';
    const hasPoster = Boolean(item.posterUrl && !failedPosterIds.has(item.id));

    return (
      <div
        key={item.id}
        className="rounded-3xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/10 transition-all duration-300 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
      >
        {/* Card Header */}
        <div
          onClick={() => toggleExpand(item.id)}
          className="p-5 tablet-p:p-6 cursor-pointer flex flex-col tablet-p:flex-row tablet-p:items-center justify-between gap-4 select-none"
        >
          <div className="flex items-start tablet-p:items-center gap-4 min-w-0">
            {/* Poster / Box */}
            {hasPoster ? (
              <div className="w-12 h-16 rounded-xl overflow-hidden shadow-[0_8px_16px_rgba(0,0,0,0.4)] shrink-0 border border-white/20 transition-transform group-hover:scale-105 bg-black/40">
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
                  onError={() => {
                    setFailedPosterIds((prev) => new Set(prev).add(item.id));
                  }}
                />
              </div>
            ) : (
              <div
                className="w-12 h-16 rounded-xl flex flex-col justify-between p-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.4)] shrink-0 border border-white/20 transition-transform group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${posterBg}, ${posterBg}88)`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                {item.type === 'movie' ? (
                  <Film className="w-3.5 h-3.5 text-white/90 self-end" />
                ) : (
                  <Tv className="w-3.5 h-3.5 text-white/90 self-end" />
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {/* Type badge */}
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white flex items-center gap-1">
                  {item.type === 'movie' ? (
                    <>
                      <Film className="w-3 h-3 text-accent-pink" />
                      <span>Film</span>
                    </>
                  ) : (
                    <>
                      <Tv className="w-3 h-3 text-accent-mint" />
                      <span>Dizi</span>
                    </>
                  )}
                </span>

                {item.genre && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
                    {item.genre}
                  </span>
                )}

                {/* Status badge */}
                <span
                  className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                    item.status === 'watched'
                      ? 'bg-accent-mint/15 text-accent-mint'
                      : item.status === 'watching'
                      ? 'bg-accent-yellow/15 text-accent-yellow'
                      : item.status === 'waiting_season'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                      : 'bg-white/10 text-text-muted'
                  }`}
                >
                  {item.status === 'watched'
                    ? 'İzlendi'
                    : item.status === 'watching'
                    ? 'İzleniyor'
                    : item.status === 'waiting_season'
                    ? 'Yeni Sezon Bekleniyor'
                    : 'İzlenecek'}
                </span>

                {item.watchedDate && item.status === 'watched' && (
                  <span className="text-[11px] font-bold text-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.watchedDate.slice(0, 10)}
                  </span>
                )}
              </div>

              <h3 className="text-xl tablet-p:text-2xl font-black font-display text-white tracking-tight leading-snug truncate">
                {item.title}
              </h3>

              <div className="flex items-center gap-2 text-xs font-bold text-text-secondary mt-0.5">
                {item.director && <span>{item.director}</span>}
                {item.director && item.year && <span>·</span>}
                {item.year && <span>{item.year}</span>}
              </div>
            </div>
          </div>

          {/* Right side info & toggles */}
          <div className="flex items-center justify-between tablet-p:justify-end gap-5 shrink-0 pt-2 tablet-p:pt-0 border-t tablet-p:border-t-0 border-white/5">
            {/* Rating Stars */}
            {item.rating ? (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < item.rating!
                        ? 'fill-accent-yellow text-accent-yellow'
                        : 'text-white/15'
                    }`}
                  />
                ))}
              </div>
            ) : null}

            {/* Runtime / Series progress badge */}
            <span className="text-xs font-black text-white/90 tabular-nums px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
              {item.type === 'movie' ? (
                item.runtimeMinutes ? `${item.runtimeMinutes} dk` : 'Film'
              ) : (
                item.status === 'watching' && item.currentSeason && item.currentEpisode
                  ? `S${item.currentSeason} B${item.currentEpisode}`
                  : item.totalSeasons
                  ? `${item.totalSeasons} Sezon`
                  : 'Dizi'
              )}
            </span>

            {/* Expand toggle */}
            <div className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>

        {/* EXPANDABLE DETAILS */}
        {isExpanded && (
          <div className="p-5 tablet-p:p-8 pt-0 border-t border-white/10 bg-black/25 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className={`flex flex-col ${hasPoster ? 'tablet-p:flex-row' : ''} gap-6 pt-5`}>
              {/* Large Poster */}
              {hasPoster && (
                <div className="w-28 h-40 shrink-0 rounded-2xl overflow-hidden border border-white/20 shadow-[0_12px_28px_rgba(0,0,0,0.5)] bg-black/40 self-start">
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Extended Details & Notes */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                  {item.originalTitle && (
                    <div>
                      <span className="font-bold text-text-secondary">Orijinal Adı:</span>{' '}
                      <span className="text-white">{item.originalTitle}</span>
                    </div>
                  )}
                  {item.type === 'series' && (item.totalSeasons || item.totalEpisodes) && (
                    <div>
                      <span className="font-bold text-text-secondary">Dizi Bilgisi:</span>{' '}
                      <span className="text-white">
                        {item.totalSeasons ? `${item.totalSeasons} Sezon ` : ''}
                        {item.totalEpisodes ? `(${item.totalEpisodes} Bölüm)` : ''}
                      </span>
                    </div>
                  )}
                  {item.type === 'movie' && item.runtimeMinutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-accent-pink" />
                      <span>{item.runtimeMinutes} Dakika</span>
                    </div>
                  )}
                </div>

                {item.notes ? (
                  <div className="p-4 tablet-p:p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-accent-pink block">
                      KİŞİSEL İNCELEME & NOTLAR
                    </span>
                    <p className="text-sm tablet-p:text-base text-text-secondary leading-relaxed font-sans font-medium whitespace-pre-wrap">
                      {item.notes}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white/[0.015] border border-dashed border-white/10 text-xs text-text-muted">
                    Bu yapım için henüz kişisel inceleme veya not girilmedi.
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => deleteMediaItem(item.id)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-accent-coral/20 text-accent-coral text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sil</span>
              </button>

              <button
                onClick={() => openEditMediaModal(item)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Düzenle</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col p-6 tablet-p:p-10 tablet-l:p-14 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* HERO SECTION */}
      <section className="mb-8 tablet-l:mb-12">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[11px] uppercase tracking-[0.35em] font-black text-accent-pink flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" />
            <span>KİŞİSEL SİNEMA & DİZİ GÜNLÜĞÜ</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse shadow-[0_0_10px_#2EE6B6]" />
        </div>

        <div className="flex flex-col tablet-p:flex-row tablet-p:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl tablet-p:text-5xl tablet-l:text-6xl font-black font-display text-white tracking-tight">
              Film & Dizi Arşivi
            </h1>
            <p className="text-sm tablet-p:text-base text-text-muted mt-2 max-w-xl">
              İzlediğin başyapıtlar, güncel diziler ve unutulmaz anlar.
            </p>
          </div>

          <button
            onClick={openCreateMediaModal}
            className="min-h-[48px] px-6 py-3 rounded-2xl bg-gradient-to-r from-accent-pink to-[#FF5E8E] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,61,127,0.35)] hover:shadow-[0_12px_32px_rgba(255,61,127,0.5)] active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>YENİ FİLM / DİZİ EKLE</span>
          </button>
        </div>
      </section>

      {/* STATS BAR (4 CARDS) */}
      <section className="grid grid-cols-2 tablet-l:grid-cols-4 gap-4 tablet-p:gap-6 mb-8 tablet-l:mb-10">
        {/* Card 1: Bu Yıl Film */}
        <div className="p-5 tablet-p:p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.015] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-pink/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-accent-pink block mb-1">
            BU YIL FİLM
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl tablet-p:text-5xl font-black font-display text-white tabular-nums tracking-tight">
              {stats.thisYearMoviesCount}
            </span>
            <span className="text-xs font-bold text-text-muted uppercase">Film</span>
          </div>
          <span className="text-xs text-text-secondary mt-1 block">
            {currentYear} içinde izlendi
          </span>
        </div>

        {/* Card 2: Bu Yıl Dizi */}
        <div className="p-5 tablet-p:p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.015] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-mint/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-accent-mint block mb-1">
            BU YIL DİZİ
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl tablet-p:text-5xl font-black font-display text-accent-mint tabular-nums tracking-tight">
              {stats.thisYearSeriesCount}
            </span>
            <span className="text-xs font-bold text-text-muted uppercase">Dizi</span>
          </div>
          <span className="text-xs text-text-secondary mt-1 block">
            {currentYear} tamamlanan
          </span>
        </div>

        {/* Card 3: Tüm Zamanlar */}
        <div className="p-5 tablet-p:p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.015] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-yellow/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-accent-yellow block mb-1">
            TÜM ZAMANLAR
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl tablet-p:text-5xl font-black font-display text-accent-yellow tabular-nums tracking-tight">
              {stats.allTimeCount}
            </span>
            <span className="text-xs font-bold text-text-muted uppercase">Yapım</span>
          </div>
          <span className="text-xs text-text-secondary mt-1 block">
            İzlenen toplam içerik
          </span>
        </div>

        {/* Card 4: Toplam İzleme Süresi */}
        <div className="p-5 tablet-p:p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.015] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#A78BFA] block mb-1">
            İZLEME SÜRESİ
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl tablet-p:text-4xl font-black font-display text-[#C4B5FD] tabular-nums tracking-tight">
              {stats.durationFormatted}
            </span>
          </div>
          <span className="text-xs text-text-secondary mt-1 block">
            Tahmini toplam süre
          </span>
        </div>
      </section>

      {/* FILTER & SEARCH CONTROLS */}
      <section className="flex flex-col tablet-l:flex-row items-stretch tablet-l:items-center justify-between gap-4 mb-6">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'watched', label: 'İzlenenler' },
            { id: 'watching', label: 'Şu An İzlenenler' },
            { id: 'waiting_season', label: 'Yeni Sezon Bekleyenler' },
            { id: 'to_watch', label: 'İzlenecekler' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st.id
                  ? 'bg-accent-pink text-white shadow-[0_0_12px_rgba(255,61,127,0.35)]'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter Tabs (Film / Dizi) */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/5">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'movie', label: 'Filmler' },
              { id: 'series', label: 'Diziler' },
            ].map((tp) => (
              <button
                key={tp.id}
                onClick={() => setTypeFilter(tp.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  typeFilter === tp.id
                    ? 'bg-white/15 text-white'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {tp.label}
              </button>
            ))}
          </div>

          {/* Genre Filter */}
          {genres.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-text-secondary">
              <Filter className="w-3.5 h-3.5 text-accent-pink shrink-0" />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-transparent border-0 text-xs text-white focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-[#101744] text-white">Tüm Türler</option>
                {genres.map((g) => (
                  <option key={g} value={g} className="bg-[#101744] text-white">
                    {g}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Display Mode: Flat List vs By Year */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/5">
            <button
              onClick={() => setDisplayMode('flat')}
              className={`p-1.5 rounded-xl transition-all ${
                displayMode === 'flat' ? 'bg-white/15 text-white' : 'text-text-muted hover:text-white'
              }`}
              title="Düz Liste"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDisplayMode('byYear')}
              className={`p-1.5 rounded-xl transition-all ${
                displayMode === 'byYear' ? 'bg-white/15 text-white' : 'text-text-muted hover:text-white'
              }`}
              title="Yıllara Göre Grupla"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Film, dizi veya yönetmen ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-text-muted/60 focus:border-accent-pink focus:outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      {/* MEDIA LIST */}
      {filteredMedia.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/5 text-center flex flex-col items-center justify-center my-6">
          <Film className="w-12 h-12 text-accent-pink/40 mb-3" />
          <h3 className="text-lg font-bold text-white">Henüz kayıtlı film veya dizi bulunamadı</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm">
            Filtreleri değiştirebilir veya ilk filmini ya da dizini kütüphanene hemen ekleyebilirsin.
          </p>
          <button
            onClick={openCreateMediaModal}
            className="mt-4 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Yeni Film / Dizi Ekle
          </button>
        </div>
      ) : displayMode === 'byYear' ? (
        /* BY YEAR GROUPED LIST */
        <div className="space-y-8">
          {mediaByYear.map((group) => (
            <div key={group.year} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                <span className="text-xl tablet-p:text-2xl font-black font-display text-white tracking-tight">
                  {group.year}
                </span>
                <span className="text-xs font-bold text-accent-mint px-2.5 py-0.5 rounded-full bg-accent-mint/10 border border-accent-mint/20">
                  {group.moviesCount > 0 ? `${group.moviesCount} Film` : ''}
                  {group.moviesCount > 0 && group.seriesCount > 0 ? ' · ' : ''}
                  {group.seriesCount > 0 ? `${group.seriesCount} Dizi` : ''}
                </span>
              </div>
              <div className="space-y-4">
                {group.items.map((item) => renderMediaCard(item))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* FLAT LIST */
        <div className="space-y-4">
          {filteredMedia.map((item) => renderMediaCard(item))}
        </div>
      )}
    </div>
  );
};

