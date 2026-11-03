import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { calculateAllItemsProgress } from '../../utils/progressCalculator';
import { ChevronRight, Plus } from 'lucide-react';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const YearView: React.FC = () => {
  const { items, openCreateModal, setSelectedDate, setActiveView } = usePlannerStore();
  const currentYear = new Date().getFullYear();
  const calculatedMap = calculateAllItemsProgress(items);

  // Filter yearly goals
  const yearlyGoals = items
    .filter((i) => i.horizon === 'year')
    .map((g) => calculatedMap.get(g.id)!);

  // Group tasks by month
  const tasksByMonth = new Map<number, number>();
  const doneByMonth = new Map<number, number>();

  items.forEach((item) => {
    if (item.startDate) {
      const d = new Date(item.startDate);
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth();
        tasksByMonth.set(m, (tasksByMonth.get(m) || 0) + 1);
        if (item.status === 'done') {
          doneByMonth.set(m, (doneByMonth.get(m) || 0) + 1);
        }
      }
    }
  });

  const handleMonthClick = (monthIndex: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    setSelectedDate(`${currentYear}-${monthStr}-01`);
    setActiveView('month');
  };

  return (
    <div className="flex-1 flex flex-col p-6 tablet-p:p-10 tablet-l:p-14 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col tablet-p:flex-row tablet-p:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] font-black text-accent-pink block mb-2">
            YILLIK BAKIŞ
          </span>
          <h2 className="text-5xl tablet-p:text-7xl tablet-l:text-8xl font-black font-display text-white tracking-[-0.03em] tabular-nums leading-none">
            {currentYear}
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            12 aylık genel tempo, ilerleme ve bu yılın stratejik hedefleri.
          </p>
        </div>

        <button
          onClick={() => openCreateModal({ horizon: 'year' })}
          className="min-h-touch px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-accent-pink stroke-[3]" />
          <span>Yıllık Hedef Ekle</span>
        </button>
      </div>

      {/* Top Section: Yearly Goals Summary Cards */}
      <div className="mb-12">
        <h3 className="text-xs uppercase tracking-[0.25em] font-black text-text-muted mb-4">
          BU YILIN STRATEJİK HEDEFLERİ
        </h3>

        <div className="grid grid-cols-1 tablet-p:grid-cols-2 gap-4">
          {yearlyGoals.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/[0.015] border border-white/5 text-center col-span-2 text-text-muted">
              Henüz yıllık hedef tanımlanmadı.
            </div>
          ) : (
            yearlyGoals.map((goal) => (
              <div
                key={goal.id}
                className="p-6 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {goal.isLeaf ? (
                        <button
                          onClick={() => usePlannerStore.getState().toggleItemStatus(goal.id)}
                          className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            goal.status === 'done'
                              ? 'bg-accent-mint text-bg-deep shadow-[0_0_12px_rgba(46,230,182,0.4)]'
                              : 'border-2 border-white/20 hover:border-accent-pink text-transparent'
                          }`}
                          aria-label="Tamamla"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      ) : null}
                      <div>
                        <h4
                          onClick={() => openCreateModal({ horizon: 'month', parentId: goal.id })}
                          className="text-lg font-bold font-display text-white cursor-pointer hover:text-accent-pink transition-colors"
                        >
                          {goal.title}
                        </h4>
                        {!goal.isLeaf && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-text-muted mt-0.5 block">
                            {goal.completedChildrenCount}/{goal.childrenCount} Alt Hedef
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-2xl font-black font-display text-accent-mint tabular-nums shrink-0">
                      %{goal.progress}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-text-secondary mb-4 line-clamp-2">{goal.description}</p>
                  )}
                </div>

                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-accent-mint rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(46,230,182,0.4)]"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 12 Months Heatmap / Mini Grid */}
      <div>
        <h3 className="text-xs uppercase tracking-[0.25em] font-black text-text-muted mb-4">
          AYLAR VE GÖREV YOĞUNLUĞU
        </h3>

        <div className="grid grid-cols-2 tablet-p:grid-cols-3 tablet-l:grid-cols-4 gap-4">
          {MONTH_NAMES.map((name, index) => {
            const count = tasksByMonth.get(index) || 0;
            const done = doneByMonth.get(index) || 0;
            const percent = count > 0 ? Math.round((done / count) * 100) : 0;
            const isCurrentMonth = new Date().getMonth() === index;

            return (
              <div
                key={name}
                onClick={() => handleMonthClick(index)}
                className={`p-5 rounded-3xl cursor-pointer transition-all duration-200 group flex flex-col justify-between min-h-[130px] ${
                  isCurrentMonth
                    ? 'bg-accent-pink/15 shadow-[0_8px_24px_rgba(255,61,127,0.2)] ring-1 ring-accent-pink/40'
                    : 'bg-white/[0.025] hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-text-muted group-hover:text-white transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-pink group-hover:translate-x-0.5 transition-all" />
                </div>

                <div>
                  <h4 className="text-xl font-bold font-display text-white">{name}</h4>
                  <div className="flex items-center justify-between text-xs text-text-muted mt-1 tabular-nums">
                    <span>{count > 0 ? `${count} kayıtlı öğe` : 'Planlanmamış'}</span>
                    {count > 0 && (
                      <span className="font-bold text-accent-mint">%{percent}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
