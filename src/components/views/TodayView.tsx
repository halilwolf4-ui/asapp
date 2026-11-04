import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import {
  formatFullDateTr,
  formatIsoDateOnly,
  parseISO,
} from '../../utils/dateUtils';
import { Check, Clock, Plus, Edit2, Sparkles, Target, ArrowUpRight, Repeat, CheckCircle2 } from 'lucide-react';
import { calculateAllItemsProgress } from '../../utils/progressCalculator';

export const TodayView: React.FC = () => {
  const {
    items,
    categories,
    openCreateModal,
    openEditModal,
    toggleItemStatus,
    finishItemAndClearFutureRecurrences,
    quote,
    setQuote,
    setActiveView,
  } = usePlannerStore();

  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [quoteInput, setQuoteInput] = useState(quote);

  const todayStr = formatIsoDateOnly(new Date());
  const calculatedMap = calculateAllItemsProgress(items);

  // Filter today's tasks
  const todayItems = items
    .filter((i) => i.horizon === 'day' && i.startDate === todayStr)
    .sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return 0;
    });

  const completedCount = todayItems.filter((i) => i.status === 'done').length;
  const dayProgress =
    todayItems.length > 0 ? Math.round((completedCount / todayItems.length) * 100) : 0;

  // Active week & month goals for summary section
  const activeWeekGoals = items
    .filter((i) => i.horizon === 'week')
    .slice(0, 2)
    .map((g) => calculatedMap.get(g.id)!);

  const activeMonthGoals = items
    .filter((i) => i.horizon === 'month')
    .slice(0, 2)
    .map((g) => calculatedMap.get(g.id)!);

  const handleSaveQuote = () => {
    if (quoteInput.trim()) {
      setQuote(quoteInput.trim());
    }
    setIsEditingQuote(false);
  };

  const currentDateObj = parseISO(todayStr);
  const dayNum = currentDateObj.getDate();
  const monthName = currentDateObj.toLocaleString('tr-TR', { month: 'long' }).toUpperCase();
  const weekDayName = currentDateObj.toLocaleString('tr-TR', { weekday: 'long' }).toUpperCase();

  return (
    <div className="flex-1 flex flex-col p-6 tablet-p:p-10 tablet-l:p-14 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* TOP: MASSIVE CLAMP-DRIVEN DISPLAY HERO TYPOGRAPHY */}
      <section className="mb-10 tablet-l:mb-14">
        {/* Caption Tagline */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[11px] uppercase tracking-[0.35em] font-black text-accent-pink">
            BUGÜNÜN ODAĞI
          </span>
          <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse shadow-[0_0_10px_#2EE6B6]" />
          <span className="text-xs uppercase tracking-widest text-text-muted font-bold">
            {formatFullDateTr(currentDateObj)}
          </span>
        </div>

        {/* Theatrical Monumental Display Typography */}
        <div className="flex flex-col tablet-l:flex-row tablet-l:items-end justify-between gap-6">
          <div className="flex items-baseline gap-4 tablet-p:gap-6">
            {/* Monumental Day Number */}
            <span className="text-[clamp(5rem,14vw,10.5rem)] font-black font-display text-white tracking-[-0.05em] leading-[0.82] tabular-nums select-none">
              {String(dayNum).padStart(2, '0')}
            </span>

            {/* Stacked Month & Weekday Name */}
            <div className="flex flex-col justify-end">
              <span className="text-[clamp(1.75rem,4.5vw,3.5rem)] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight leading-[0.9]">
                {monthName}
              </span>
              <span className="text-[clamp(1rem,2vw,1.75rem)] font-extrabold font-display text-accent-pink tracking-wider uppercase leading-snug mt-1">
                {weekDayName}
              </span>
            </div>
          </div>

          {/* Minimalist Tabular Completion Metric */}
          <div className="flex items-baseline gap-4 pb-2">
            <span className="text-[clamp(3rem,6vw,4.75rem)] font-black font-display tabular-nums text-accent-mint leading-none">
              %{dayProgress}
            </span>
            <div className="text-left">
              <span className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-text-muted block">
                TAMAMLANDI
              </span>
              <span className="text-sm font-bold text-text-secondary tabular-nums">
                {completedCount} / {todayItems.length} Görev
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Editable Motivational Quote */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 group max-w-2xl">
          {isEditingQuote ? (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={quoteInput}
                onChange={(e) => setQuoteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveQuote()}
                className="flex-1 bg-white/5 border border-accent-pink rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveQuote}
                className="px-3 py-2 bg-accent-pink rounded-xl text-xs font-bold text-white uppercase"
              >
                Kaydet
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                setQuoteInput(quote);
                setIsEditingQuote(true);
              }}
              className="cursor-pointer flex items-center gap-2 text-text-muted hover:text-white transition-colors"
            >
              <Sparkles className="w-4 h-4 text-accent-yellow shrink-0" />
              <p className="text-sm italic font-medium">"{quote}"</p>
              <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-text-muted transition-opacity" />
            </div>
          )}
        </div>
      </section>

      {/* MAIN TWO-COLUMN / TABLET LAYOUT */}
      <div className="grid grid-cols-1 tablet-l:grid-cols-12 gap-8 tablet-l:gap-14 flex-1">
        {/* LEFT (7 cols): TODAY'S TASKS LIST */}
        <div className="tablet-l:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs uppercase tracking-[0.25em] font-black text-text-muted">
              GÜNLÜK GÖREVLER
            </h2>
            <button
              onClick={() => openCreateModal({ horizon: 'day', date: todayStr })}
              className="text-xs uppercase font-extrabold tracking-widest text-accent-pink hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>GÖREV EKLE</span>
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {todayItems.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white/[0.015] border border-white/5 text-center flex flex-col items-center justify-center">
                <p className="text-text-secondary font-medium">Bugün için henüz bir görev yok.</p>
                <button
                  onClick={() => openCreateModal({ horizon: 'day', date: todayStr })}
                  className="mt-4 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  İlk Görevi Ekle
                </button>
              </div>
            ) : (
              todayItems.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                const isDone = item.status === 'done';

                return (
                  <div
                    key={item.id}
                    className={`group p-4 tablet-p:p-5 rounded-2xl transition-all duration-200 flex items-start gap-4 ${
                      isDone
                        ? 'bg-white/[0.015] opacity-50'
                        : 'bg-white/[0.035] hover:bg-white/[0.07]'
                    }`}
                  >
                    {/* Checkbox Toggle Button */}
                    <button
                      onClick={() => toggleItemStatus(item.id)}
                      className={`min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center transition-all ${
                        isDone
                          ? 'bg-accent-mint text-bg-deep shadow-[0_0_14px_rgba(46,230,182,0.4)]'
                          : 'border-2 border-white/20 hover:border-accent-pink text-transparent'
                      }`}
                      aria-label="Tamamla"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    {/* Content */}
                    <div
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => openEditModal(item)}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {item.time && (
                          <span className="flex items-center gap-1 text-xs font-bold text-accent-pink tabular-nums">
                            <Clock className="w-3.5 h-3.5" />
                            {item.time}
                          </span>
                        )}
                        <span
                          className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${cat?.color || '#FF3D7F'}1A`,
                            color: cat?.color || '#FF3D7F',
                          }}
                        >
                          {cat?.name || 'Genel'}
                        </span>
                        {item.recurrenceGroupId && (
                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent-pink/15 text-accent-pink">
                            <Repeat className="w-3 h-3" />
                            <span>Tekrarlayan</span>
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-lg font-semibold text-white leading-snug ${
                          isDone ? 'line-through text-text-muted' : ''
                        }`}
                      >
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Parent Connection */}
                      {item.parentId && (
                        <p className="text-xs text-accent-mint font-medium mt-2 flex items-center gap-1">
                          <span>↳</span>
                          <span>
                            {items.find((p) => p.id === item.parentId)?.title || 'Üst Hedef'}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Quick Finish Button ("Bitir") */}
                    {!isDone ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          finishItemAndClearFutureRecurrences(item.id);
                        }}
                        className="self-center min-h-[38px] px-3.5 py-1.5 rounded-xl bg-accent-mint/15 hover:bg-accent-mint/25 text-accent-mint text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border border-accent-mint/30 opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 shrink-0"
                        title={
                          item.recurrenceGroupId
                            ? 'Görevi %100 bitir ve gelecekteki tekrarları sil'
                            : 'Görevi %100 tamamla'
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Bitir</span>
                      </button>
                    ) : (
                      <span className="self-center text-xs font-black text-accent-mint tabular-nums shrink-0 px-2 py-1 bg-accent-mint/10 rounded-lg">
                        %100
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT (5 cols): WEEK & MONTH HORIZON PROGRESS WIDGETS */}
        <div className="tablet-l:col-span-5 flex flex-col gap-6">
          {/* Active Week Goals Widget */}
          <div className="p-6 rounded-3xl bg-white/[0.025]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-accent-mint flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>BU HAFTANIN ODAKLARI</span>
              </span>
              <button
                onClick={() => setActiveView('week')}
                className="text-text-muted hover:text-white text-xs font-bold flex items-center gap-1"
              >
                Tümü <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {activeWeekGoals.length === 0 ? (
                <p className="text-xs text-text-muted">Bu hafta için tanımlı hedef bulunamadı.</p>
              ) : (
                activeWeekGoals.map((g) => (
                  <div key={g.id} className="p-3.5 rounded-2xl bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-bold text-white truncate max-w-[220px]">
                        {g.title}
                      </h4>
                      <span className="text-xs font-black font-display text-accent-mint tabular-nums">
                        %{g.progress}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-accent-mint rounded-full transition-all duration-500"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Month Goals Widget */}
          <div className="p-6 rounded-3xl bg-white/[0.025]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-accent-pink flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>BU AYIN HEDEFLERİ</span>
              </span>
              <button
                onClick={() => setActiveView('month')}
                className="text-text-muted hover:text-white text-xs font-bold flex items-center gap-1"
              >
                Tümü <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {activeMonthGoals.length === 0 ? (
                <p className="text-xs text-text-muted">Bu ay için tanımlı hedef bulunamadı.</p>
              ) : (
                activeMonthGoals.map((g) => (
                  <div key={g.id} className="p-3.5 rounded-2xl bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-bold text-white truncate max-w-[220px]">
                        {g.title}
                      </h4>
                      <span className="text-xs font-black font-display text-accent-pink tabular-nums">
                        %{g.progress}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-accent-pink rounded-full transition-all duration-500"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
