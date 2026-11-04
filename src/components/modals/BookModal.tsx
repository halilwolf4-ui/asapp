import React, { useState, useEffect } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { BookQuote } from '../../types';
import { X, Trash2, Plus, Star, Quote as QuoteIcon } from 'lucide-react';

const COVER_COLORS = [
  { label: 'Mor', color: '#8A4FFF' },
  { label: 'Pembe', color: '#FF3D7F' },
  { label: 'Nane Yeşili', color: '#2EE6B6' },
  { label: 'Altın Sarısı', color: '#FFB800' },
  { label: 'Mavi', color: '#3B82F6' },
  { label: 'Kızıl', color: '#E11D48' },
];

const GENRE_SUGGESTIONS = [
  'Felsefe',
  'Kişisel Gelişim',
  'Roman',
  'Bilim Kurgu',
  'Tarih & Biyografi',
  'İş & Kariyer',
  'Tasarım & Mimarlık',
  'Psikoloji',
];

export const BookModal: React.FC = () => {
  const { isBookModalOpen, editingBook, closeBookModal, addBook, updateBook, deleteBook } =
    usePlannerStore();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState<number>(200);
  const [readPages, setReadPages] = useState<number>(200);
  const [status, setStatus] = useState<'read' | 'reading' | 'to_read'>('read');
  const [completedDate, setCompletedDate] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [genre, setGenre] = useState('Felsefe');
  const [coverColor, setCoverColor] = useState('#8A4FFF');
  const [notes, setNotes] = useState('');
  const [quotes, setQuotes] = useState<BookQuote[]>([]);

  // New quote draft inputs
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuotePage, setNewQuotePage] = useState('');

  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title);
      setAuthor(editingBook.author);
      setTotalPages(editingBook.totalPages || 0);
      setReadPages(editingBook.readPages ?? (editingBook.status === 'read' ? editingBook.totalPages : 0));
      setStatus(editingBook.status);
      setCompletedDate(editingBook.completedDate || '');
      setRating(editingBook.rating || 5);
      setGenre(editingBook.genre || 'Felsefe');
      setCoverColor(editingBook.coverColor || '#8A4FFF');
      setNotes(editingBook.notes || '');
      setQuotes(editingBook.quotes ? [...editingBook.quotes] : []);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setTitle('');
      setAuthor('');
      setTotalPages(250);
      setReadPages(250);
      setStatus('read');
      setCompletedDate(today);
      setRating(5);
      setGenre('Felsefe');
      setCoverColor('#8A4FFF');
      setNotes('');
      setQuotes([]);
    }
    setNewQuoteText('');
    setNewQuotePage('');
  }, [editingBook, isBookModalOpen]);

  if (!isBookModalOpen) return null;

  const handleAddQuoteDraft = () => {
    if (!newQuoteText.trim()) return;
    const newQ: BookQuote = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: newQuoteText.trim(),
      page: newQuotePage.trim() || undefined,
    };
    setQuotes([...quotes, newQ]);
    setNewQuoteText('');
    setNewQuotePage('');
  };

  const handleRemoveQuote = (id: string) => {
    setQuotes(quotes.filter((q) => q.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    // If there's an unsaved quote draft in the input, add it as well
    let finalQuotes = [...quotes];
    if (newQuoteText.trim()) {
      finalQuotes.push({
        id: 'q_' + Date.now(),
        text: newQuoteText.trim(),
        page: newQuotePage.trim() || undefined,
      });
    }

    const payload = {
      title: title.trim(),
      author: author.trim(),
      totalPages: Number(totalPages) || 0,
      readPages: status === 'read' ? Number(totalPages) : Number(readPages) || 0,
      status,
      completedDate: status === 'read' ? completedDate || new Date().toISOString().slice(0, 10) : undefined,
      rating,
      genre: genre.trim() || 'Genel',
      coverColor,
      notes: notes.trim() || undefined,
      quotes: finalQuotes,
    };

    if (editingBook) {
      updateBook(editingBook.id, payload);
    } else {
      addBook(payload);
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
              style={{ backgroundColor: coverColor }}
            />
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-accent-pink block mb-0.5">
                {editingBook ? 'KİTABI DÜZENLE' : 'KİTAPLIĞA YENİ KİTAP EKLE'}
              </span>
              <h2 className="text-2xl font-black font-display text-white tracking-tight">
                {editingBook ? editingBook.title : 'Kitap ve Okuma Notu Ekle'}
              </h2>
            </div>
          </div>

          <button
            onClick={closeBookModal}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <form id="book-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Tabs: Okundu / Okunuyor / Okunacak */}
          <div>
            <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
              Okuma Durumu
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'read', label: 'Okundu' },
                  { id: 'reading', label: 'Okunuyor' },
                  { id: 'to_read', label: 'Okunacak' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id)}
                  className={`min-h-[44px] py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center ${
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

          {/* Title & Author */}
          <div className="grid grid-cols-1 tablet-p:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                Kitap Adı *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Kendime Düşünceler"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white placeholder-text-muted/60 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                Yazar *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Marcus Aurelius"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
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
                list="genres-list"
                placeholder="Örn: Felsefe"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white placeholder-text-muted/60 focus:outline-none transition-colors"
              />
              <datalist id="genres-list">
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

          {/* Pages & Date */}
          <div className="grid grid-cols-1 tablet-p:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                Toplam Sayfa Sayısı *
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalPages}
                onChange={(e) => setTotalPages(Number(e.target.value))}
                className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            {status === 'read' ? (
              <div>
                <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                  Okunma Tarihi
                </label>
                <input
                  type="date"
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>
            ) : status === 'reading' ? (
              <div>
                <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                  Şu Ana Kadar Okunan Sayfa
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalPages}
                  value={readPages}
                  onChange={(e) => setReadPages(Number(e.target.value))}
                  className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>
            ) : null}
          </div>

          {/* Theme Cover Color Picker */}
          <div>
            <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
              Kapak / Sırt Rengi
            </label>
            <div className="flex items-center gap-3">
              {COVER_COLORS.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setCoverColor(c.color)}
                  className={`w-9 h-9 rounded-2xl transition-all flex items-center justify-center ${
                    coverColor === c.color
                      ? 'ring-2 ring-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Notes (Notlar) */}
          <div>
            <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
              Kitap Hakkında Notlar & Düşünceler
            </label>
            <textarea
              rows={3}
              placeholder="Bu kitap sana ne kattı? Temel fikirler, eleştiriler veya hatırlamak istediğin detaylar..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none transition-colors"
            />
          </div>

          {/* Quotes (Alıntılar) Section */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase font-extrabold tracking-wider text-accent-pink flex items-center gap-1.5">
                <QuoteIcon className="w-3.5 h-3.5" />
                <span>Kitaptan Alıntılar</span>
              </label>
              <span className="text-[11px] text-text-muted">
                {quotes.length} alıntı eklendi
              </span>
            </div>

            {/* List of already added quotes */}
            {quotes.length > 0 && (
              <div className="space-y-2">
                {quotes.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-serif italic text-white/95 text-sm leading-relaxed">
                        “{q.text}”
                      </p>
                      {q.page && (
                        <span className="text-[10px] font-bold text-accent-mint mt-1 block">
                          — Sayfa {q.page}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuote(q.id)}
                      className="text-text-muted hover:text-accent-coral p-1 transition-colors"
                      title="Alıntıyı sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new quote draft row */}
            <div className="p-3 rounded-2xl bg-black/20 border border-white/10 space-y-2">
              <textarea
                rows={2}
                placeholder="Örn: Ruhun rengi, düşüncelerinin rengidir..."
                value={newQuoteText}
                onChange={(e) => setNewQuoteText(e.target.value)}
                className="w-full bg-transparent border-0 text-sm text-white placeholder-text-muted/50 focus:outline-none font-serif italic"
              />
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                <input
                  type="text"
                  placeholder="Sayfa No (Opsiyonel)"
                  value={newQuotePage}
                  onChange={(e) => setNewQuotePage(e.target.value)}
                  className="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-text-muted/50 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleAddQuoteDraft}
                  disabled={!newQuoteText.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-accent-pink/20 hover:bg-accent-pink/30 text-accent-pink disabled:opacity-30 disabled:pointer-events-none text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Alıntıyı Ekle</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="p-4 px-6 border-t border-white/10 bg-[#0E143E] shrink-0 flex items-center justify-between gap-4">
          {editingBook ? (
            <button
              type="button"
              onClick={() => {
                deleteBook(editingBook.id);
                closeBookModal();
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
              onClick={closeBookModal}
              className="min-h-[46px] px-5 py-2.5 rounded-2xl border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              form="book-form"
              className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-gradient-to-r from-accent-pink to-[#FF5E8E] text-white font-black text-xs uppercase tracking-wider shadow-[0_8px_24px_rgba(255,61,127,0.35)] hover:shadow-[0_12px_32px_rgba(255,61,127,0.5)] active:scale-95 transition-all"
            >
              {editingBook ? 'Kaydet' : 'Kitabı Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
