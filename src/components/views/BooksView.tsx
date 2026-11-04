import React, { useState, useMemo } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import {
  BookOpen,
  Plus,
  Star,
  Quote as QuoteIcon,
  ChevronDown,
  ChevronUp,
  Search,
  Bookmark,
  Calendar,
  Edit2,
  Trash2,
  BookMarked,
  Filter,
} from 'lucide-react';

export const BooksView: React.FC = () => {
  const { books, openCreateBookModal, openEditBookModal, deleteBook, addQuoteToBook, deleteQuoteFromBook } =
    usePlannerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'reading' | 'to_read'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [expandedBookIds, setExpandedBookIds] = useState<Set<string>>(new Set());

  // Inline quick quote draft state for a book
  const [inlineQuoteBookId, setInlineQuoteBookId] = useState<string | null>(null);
  const [inlineQuoteText, setInlineQuoteText] = useState('');
  const [inlineQuotePage, setInlineQuotePage] = useState('');

  const currentYear = new Date().getFullYear();

  // STATS CALCULATIONS
  const stats = useMemo(() => {
    const readBooks = books.filter((b) => b.status === 'read');

    // This year completed
    const thisYearBooks = readBooks.filter((b) => {
      if (!b.completedDate) return false;
      const year = new Date(b.completedDate).getFullYear();
      return year === currentYear;
    });

    const thisYearPages = thisYearBooks.reduce((sum, b) => sum + (b.totalPages || 0), 0);

    // All time
    const allTimeBooks = readBooks.length;
    const allTimePages = readBooks.reduce((sum, b) => sum + (b.totalPages || 0), 0);

    // Currently reading
    const currentlyReading = books.filter((b) => b.status === 'reading').length;

    return {
      thisYearBooksCount: thisYearBooks.length,
      thisYearPages,
      allTimeBooksCount: allTimeBooks,
      allTimePages,
      currentlyReading,
    };
  }, [books, currentYear]);

  // Unique genres
  const genres = useMemo(() => {
    const gSet = new Set<string>();
    books.forEach((b) => {
      if (b.genre) gSet.add(b.genre);
    });
    return Array.from(gSet);
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      if (statusFilter !== 'all' && book.status !== statusFilter) return false;
      if (selectedGenre !== 'all' && book.genre !== selectedGenre) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = book.title.toLowerCase().includes(q);
        const matchesAuthor = book.author.toLowerCase().includes(q);
        const matchesNotes = book.notes?.toLowerCase().includes(q);
        const matchesQuotes = book.quotes?.some((quote) => quote.text.toLowerCase().includes(q));
        if (!matchesTitle && !matchesAuthor && !matchesNotes && !matchesQuotes) return false;
      }
      return true;
    });
  }, [books, statusFilter, selectedGenre, searchQuery]);

  const toggleExpand = (bookId: string) => {
    setExpandedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  };

  const handleSaveInlineQuote = (bookId: string) => {
    if (!inlineQuoteText.trim()) return;
    addQuoteToBook(bookId, {
      text: inlineQuoteText.trim(),
      page: inlineQuotePage.trim() || undefined,
    });
    setInlineQuoteText('');
    setInlineQuotePage('');
    setInlineQuoteBookId(null);
  };

  return (
    <div className="flex-1 flex flex-col p-6 tablet-p:p-10 tablet-l:p-14 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* TOP: HERO TYPOGRAPHY */}
      <section className="mb-8 tablet-l:mb-12">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[11px] uppercase tracking-[0.35em] font-black text-accent-pink flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>KİŞİSEL KİTAPLIK & OKUMA GÜNLÜĞÜ</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse shadow-[0_0_10px_#2EE6B6]" />
        </div>

        <div className="flex flex-col tablet-p:flex-row tablet-p:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl tablet-p:text-5xl tablet-l:text-6xl font-black font-display text-white tracking-tight">
              Okuduğum Kitaplar
            </h1>
            <p className="text-sm tablet-p:text-base text-text-muted mt-2 max-w-xl">
              Zihnini besleyen sayfalar, derin fikirler ve unutulmaz alıntılar.
            </p>
          </div>

          <button
            onClick={openCreateBookModal}
            className="min-h-[48px] px-6 py-3 rounded-2xl bg-gradient-to-r from-accent-pink to-[#FF5E8E] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,61,127,0.35)] hover:shadow-[0_12px_32px_rgba(255,61,127,0.5)] active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>YENİ KİTAP EKLE</span>
          </button>
        </div>
      </section>

      {/* TOP STATS BAR: BU YIL & TÜM ZAMANLAR */}
      <section className="grid grid-cols-2 tablet-l:grid-cols-4 gap-4 tablet-p:gap-6 mb-8 tablet-l:mb-10">
        {/* Card 1: Bu Yıl Kitap */}
        <div className="p-5 tablet-p:p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.015] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-pink/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-accent-pink block mb-1">
            BU YIL ({currentYear})
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl tablet-p:text-5xl font-black font-display text-white tabular-nums tracking-tight">
              {stats.thisYearBooksCount}
            </span>
            <span className="text-xs font-bold text-text-muted uppercase">Kitap</span>
          </div>
          <span className="text-xs text-text-secondary mt-1 block">
            Bu yıl tamamlanan okumalar
          </span>
        </div>

        {/* Card 2: Bu Yıl Sayfa */}
        <div className="p-5 tablet-p:p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.015] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-mint/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-accent-mint block mb-1">
            BU YIL SAYFA
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl tablet-p:text-5xl font-black font-display text-accent-mint tabular-nums tracking-tight">
              {stats.thisYearPages.toLocaleString('tr-TR')}
            </span>
            <span className="text-xs font-bold text-text-muted uppercase">Sayfa</span>
          </div>
          <span className="text-xs text-text-secondary mt-1 block">
            {currentYear} yılı toplam sayfa
          </span>
        </div>

        {/* Card 3: Tüm Zamanlar Kitap */}
        <div className="p-5 tablet-p:p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.015] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-yellow/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-accent-yellow block mb-1">
            TÜM ZAMANLAR
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl tablet-p:text-5xl font-black font-display text-white tabular-nums tracking-tight">
              {stats.allTimeBooksCount}
            </span>
            <span className="text-xs font-bold text-text-muted uppercase">Kitap</span>
          </div>
          <span className="text-xs text-text-secondary mt-1 block">
            Kütüphanede okunan kitap
          </span>
        </div>

        {/* Card 4: Tüm Zamanlar Sayfa */}
        <div className="p-5 tablet-p:p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.015] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#A78BFA] block mb-1">
            TOPLAM SAYFA
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl tablet-p:text-5xl font-black font-display text-[#C4B5FD] tabular-nums tracking-tight">
              {stats.allTimePages.toLocaleString('tr-TR')}
            </span>
            <span className="text-xs font-bold text-text-muted uppercase">Sayfa</span>
          </div>
          <span className="text-xs text-text-secondary mt-1 block">
            Tüm zamanlar toplam hacim
          </span>
        </div>
      </section>

      {/* FILTER & SEARCH CONTROLS */}
      <section className="flex flex-col tablet-l:flex-row items-stretch tablet-l:items-center justify-between gap-4 mb-6">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'read', label: 'Okunanlar' },
            { id: 'reading', label: 'Şu An Okunanlar' },
            { id: 'to_read', label: 'Okunacaklar' },
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

        <div className="flex items-center gap-3">
          {/* Genre Filter Dropdown */}
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

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Kitap, yazar veya alıntı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-text-muted/60 focus:border-accent-pink focus:outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      {/* BOOKS LIST / GRID */}
      {filteredBooks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/5 text-center flex flex-col items-center justify-center my-6">
          <BookMarked className="w-12 h-12 text-accent-pink/40 mb-3" />
          <h3 className="text-lg font-bold text-white">Aradığınız kriterde kitap bulunamadı</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm">
            Filtreleri değiştirebilir veya ilk kitabınızı hemen kütüphanenize ekleyebilirsiniz.
          </p>
          <button
            onClick={openCreateBookModal}
            className="mt-4 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Yeni Kitap Ekle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBooks.map((book) => {
            const isExpanded = expandedBookIds.has(book.id);
            const coverBg = book.coverColor || '#8A4FFF';

            return (
              <div
                key={book.id}
                className="rounded-3xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/10 transition-all duration-300 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
              >
                {/* Book Card Main Header (Clickable to Expand) */}
                <div
                  onClick={() => toggleExpand(book.id)}
                  className="p-5 tablet-p:p-6 cursor-pointer flex flex-col tablet-p:flex-row tablet-p:items-center justify-between gap-4 select-none"
                >
                  <div className="flex items-start tablet-p:items-center gap-4 min-w-0">
                    {/* Simulated Aesthetic Book Spine / Mini Cover */}
                    <div
                      className="w-12 h-16 rounded-xl flex flex-col justify-between p-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.4)] shrink-0 border border-white/20 transition-transform group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${coverBg}, ${coverBg}88)`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      <Bookmark className="w-3.5 h-3.5 text-white/90 self-end" />
                    </div>

                    {/* Book Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {book.genre && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white">
                            {book.genre}
                          </span>
                        )}

                        <span
                          className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                            book.status === 'read'
                              ? 'bg-accent-mint/15 text-accent-mint'
                              : book.status === 'reading'
                              ? 'bg-accent-yellow/15 text-accent-yellow'
                              : 'bg-white/10 text-text-muted'
                          }`}
                        >
                          {book.status === 'read'
                            ? 'Okundu'
                            : book.status === 'reading'
                            ? 'Okunuyor'
                            : 'Okunacak'}
                        </span>

                        {book.completedDate && book.status === 'read' && (
                          <span className="text-[11px] font-bold text-text-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {book.completedDate.slice(0, 10)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl tablet-p:text-2xl font-black font-display text-white tracking-tight leading-snug truncate">
                        {book.title}
                      </h3>

                      <p className="text-xs font-bold text-text-secondary mt-0.5">
                        {book.author}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Pages, Stars & Expand toggle */}
                  <div className="flex items-center justify-between tablet-p:justify-end gap-5 shrink-0 pt-2 tablet-p:pt-0 border-t tablet-p:border-t-0 border-white/5">
                    {/* Star Rating */}
                    {book.rating ? (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < book.rating!
                                ? 'fill-accent-yellow text-accent-yellow'
                                : 'text-white/15'
                            }`}
                          />
                        ))}
                      </div>
                    ) : null}

                    {/* Total Pages Badge */}
                    <span className="text-xs font-black text-white/90 tabular-nums px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
                      {book.status === 'reading' && book.readPages
                        ? `${book.readPages} / ${book.totalPages} sf`
                        : `${book.totalPages} sayfa`}
                    </span>

                    {/* Expand icon */}
                    <div className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE SECTION: NOTES & QUOTES */}
                {isExpanded && (
                  <div className="p-5 tablet-p:p-8 pt-0 border-t border-white/10 bg-black/25 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* 1. PERSONAL NOTES (Notlar) */}
                    {book.notes ? (
                      <div className="p-4 tablet-p:p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                        <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-accent-pink block">
                          KİŞİSEL NOTLAR & İNCELEME
                        </span>
                        <p className="text-sm tablet-p:text-base text-text-secondary leading-relaxed font-sans font-medium whitespace-pre-wrap">
                          {book.notes}
                        </p>
                      </div>
                    ) : null}

                    {/* 2. QUOTES (Alıntılar - Tırnak içinde ve italik!) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.25em] font-black text-accent-mint flex items-center gap-1.5">
                          <QuoteIcon className="w-3.5 h-3.5" />
                          <span>ÖNE ÇIKAN ALINTILAR</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setInlineQuoteBookId(book.id)}
                          className="px-3 py-1 rounded-xl bg-accent-mint/15 hover:bg-accent-mint/25 text-accent-mint text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Alıntı Ekle</span>
                        </button>
                      </div>

                      {/* Quotes List */}
                      {book.quotes && book.quotes.length > 0 ? (
                        <div className="space-y-3">
                          {book.quotes.map((quote) => (
                            <div
                              key={quote.id}
                              className="p-4 tablet-p:p-5 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border-l-4 border-l-accent-mint border-y border-r border-white/5 relative group/quote flex items-start justify-between gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                {/* The italic quote text in quotation marks */}
                                <p className="font-serif italic text-white/95 text-base tablet-p:text-lg leading-relaxed tracking-wide selection:bg-accent-pink selection:text-white">
                                  “{quote.text}”
                                </p>
                                {quote.page && (
                                  <span className="text-xs font-bold text-accent-mint/90 mt-2 block font-sans tracking-wider">
                                    — Sayfa {quote.page}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => deleteQuoteFromBook(book.id, quote.id)}
                                className="opacity-0 group-hover/quote:opacity-100 text-text-muted hover:text-accent-coral p-1.5 transition-all"
                                title="Alıntıyı sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-white/[0.015] border border-dashed border-white/10 text-center text-xs text-text-muted">
                          Henüz bu kitaba ait bir alıntı eklenmedi. Yukarıdaki butondan ekleyebilirsiniz.
                        </div>
                      )}

                      {/* Inline quick quote form if active */}
                      {inlineQuoteBookId === book.id && (
                        <div className="p-4 rounded-2xl bg-[#0E143E] border border-accent-mint/40 space-y-3 shadow-xl animate-in fade-in duration-200">
                          <span className="text-[10px] uppercase font-bold text-accent-mint tracking-wider block">
                            Yeni Alıntı Ekle
                          </span>
                          <textarea
                            rows={2}
                            placeholder="Alıntıyı yazın (tırnak içinde italik görünecektir)..."
                            value={inlineQuoteText}
                            onChange={(e) => setInlineQuoteText(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 focus:border-accent-mint rounded-xl px-3 py-2 text-sm text-white font-serif italic focus:outline-none"
                            autoFocus
                          />
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              placeholder="Sayfa No"
                              value={inlineQuotePage}
                              onChange={(e) => setInlineQuotePage(e.target.value)}
                              className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineQuoteBookId(null);
                                  setInlineQuoteText('');
                                  setInlineQuotePage('');
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-muted hover:text-white"
                              >
                                Vazgeç
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveInlineQuote(book.id)}
                                disabled={!inlineQuoteText.trim()}
                                className="px-4 py-1.5 rounded-xl bg-accent-mint text-bg-deep font-black text-xs uppercase tracking-wider disabled:opacity-40"
                              >
                                Kaydet
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Book Actions Footer (Edit & Delete) */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                      <button
                        onClick={() => deleteBook(book.id)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-accent-coral/20 text-accent-coral text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Kitabı Sil</span>
                      </button>

                      <button
                        onClick={() => openEditBookModal(book)}
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
          })}
        </div>
      )}
    </div>
  );
};
