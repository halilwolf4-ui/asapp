import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { calculateAllItemsProgress } from '../../utils/progressCalculator';
import { Plus, ChevronRight } from 'lucide-react';

export const FiveYearView: React.FC = () => {
  const { items, categories, openCreateModal, openEditModal } = usePlannerStore();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const calculatedMap = calculateAllItemsProgress(items);

  const fiveYearGoals = items
    .filter((i) => i.horizon === 'fiveYear')
    .map((g) => calculatedMap.get(g.id)!);

  return (
    <div className="flex-1 flex flex-col p-6 tablet-p:p-10 tablet-l:p-14 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col tablet-p:flex-row tablet-p:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] font-black text-accent-mint block mb-2">
            UZUN VADELİ PERSPEKTİF
          </span>
          <h2 className="text-4xl tablet-p:text-6xl font-black font-display text-white tracking-tight leading-none">
            5 Yıllık Vizyon
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            {currentYear} — {currentYear + 4} dönemine ait yaşam vizyonları ve yıllık kilometre taşları.
          </p>
        </div>

        <button
          onClick={() => openCreateModal({ horizon: 'fiveYear' })}
          className="min-h-touch px-6 py-3.5 rounded-2xl bg-gradient-to-r from-accent-mint to-[#18B88E] text-bg-deep font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(46,230,182,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>YENİ 5 YILLIK VİZYON EKLE</span>
        </button>
      </div>

      {/* 5-Year Vision Monumental Cards */}
      <div className="space-y-6 mb-14">
        <h3 className="text-xs uppercase tracking-[0.25em] font-black text-text-muted">
          STRATEJİK VİZYONLAR
        </h3>

        {fiveYearGoals.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white/[0.015] border border-white/5 text-center text-text-muted">
            Henüz 5 yıllık vizyon tanımlanmadı.
          </div>
        ) : (
          fiveYearGoals.map((vision) => {
            const cat = categories.find((c) => c.id === vision.categoryId);

            return (
              <div
                key={vision.id}
                className="p-6 tablet-p:p-8 rounded-3xl bg-white/[0.03] hover:bg-white/[0.05] transition-all"
              >
                <div className="flex flex-col tablet-p:flex-row tablet-p:items-start justify-between gap-4 mb-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${cat?.color || '#FF3D7F'}22`,
                          color: cat?.color || '#FF3D7F',
                        }}
                      >
                        {cat?.name || 'Genel'}
                      </span>
                      <span className="text-xs text-text-muted tabular-nums font-semibold">
                        {vision.startDate?.slice(0, 4)} — {vision.endDate?.slice(0, 4) || currentYear + 4}
                      </span>
                    </div>

                    <h3
                      onClick={() => openEditModal(vision)}
                      className="text-2xl tablet-p:text-4xl font-black font-display text-white tracking-tight cursor-pointer hover:text-accent-mint transition-colors"
                    >
                      {vision.title}
                    </h3>

                    {vision.description && (
                      <p className="text-sm text-text-secondary mt-2 max-w-3xl leading-relaxed">
                        {vision.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 shrink-0">
                    <span className="text-4xl tablet-p:text-6xl font-black font-display text-accent-mint tabular-nums leading-none">
                      %{vision.progress}
                    </span>
                    <span className="text-xs uppercase font-bold text-text-muted tracking-wider">
                      İlerleme
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-6">
                  <div
                    className="h-full bg-gradient-to-r from-accent-mint to-[#24C99F] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(46,230,182,0.4)]"
                    style={{ width: `${vision.progress}%` }}
                  />
                </div>

                {/* Connected Annual Goals */}
                {vision.children && vision.children.length > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <h5 className="text-[11px] uppercase tracking-wider font-extrabold text-text-muted mb-3">
                      Bağlı Yıllık Hedefler ({vision.completedChildrenCount}/{vision.childrenCount} Tamamlandı)
                    </h5>
                    <div className="grid grid-cols-1 tablet-p:grid-cols-2 tablet-l:grid-cols-3 gap-3">
                      {vision.children.map((child) => (
                        <div
                          key={child.id}
                          onClick={() => openEditModal(child)}
                          className="p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-xs font-semibold text-white block truncate group-hover:text-accent-mint transition-colors">
                              {child.title}
                            </span>
                            <span className="text-[10px] text-text-muted mt-0.5 block">
                              {child.status === 'done' ? 'Tamamlandı' : 'Aktif Yıl'}
                            </span>
                          </div>
                          <span className="text-sm font-black font-display text-accent-mint tabular-nums">
                            %{child.progress}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5-Year Horizon Columns (Yearly Timeline) */}
      <div>
        <h3 className="text-xs uppercase tracking-[0.25em] font-black text-text-muted mb-6">
          YILLIK ZAMAN ÇİZELGESİ
        </h3>

        <div className="grid grid-cols-1 tablet-p:grid-cols-5 gap-4">
          {years.map((yr, idx) => {
            const isCurrent = idx === 0;
            const yearGoals = items.filter(
              (i) => i.horizon === 'year' && i.startDate?.startsWith(String(yr))
            );

            return (
              <div
                key={yr}
                className={`p-5 rounded-3xl transition-all flex flex-col justify-between min-h-[200px] ${
                  isCurrent
                    ? 'bg-gradient-to-b from-accent-pink/15 to-white/[0.02] ring-1 ring-accent-pink/30 shadow-[0_8px_24px_rgba(255,61,127,0.15)]'
                    : 'bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        isCurrent ? 'text-accent-pink' : 'text-text-muted'
                      }`}
                    >
                      {isCurrent ? 'BU YIL' : `+${idx} YIL`}
                    </span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-pink animate-pulse" />
                    )}
                  </div>
                  <h4 className="text-3xl font-black font-display text-white tabular-nums tracking-tight">
                    {yr}
                  </h4>
                </div>

                <div className="mt-4 space-y-1.5">
                  {yearGoals.length > 0 ? (
                    yearGoals.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => openEditModal(g)}
                        className="text-xs text-text-secondary truncate hover:text-white cursor-pointer py-1"
                      >
                        • {g.title}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-text-muted/60">Hedef planlanmamış</span>
                  )}
                </div>

                <button
                  onClick={() =>
                    openCreateModal({
                      horizon: 'year',
                      date: `${yr}-01-01`,
                    })
                  }
                  className="mt-4 pt-3 border-t border-white/5 text-[10px] uppercase font-bold text-text-muted hover:text-accent-pink flex items-center justify-between transition-colors"
                >
                  <span>Hedef Ekle</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
