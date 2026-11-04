import React, { useEffect } from 'react';
import { usePlannerStore } from './store/usePlannerStore';
import { AmbientBackground } from './components/common/AmbientBackground';
import { Navigation } from './components/common/Navigation';
import { TodayView } from './components/views/TodayView';
import { WeekView } from './components/views/WeekView';
import { MonthView } from './components/views/MonthView';
import { YearView } from './components/views/YearView';
import { FiveYearView } from './components/views/FiveYearView';
import { GoalsView } from './components/views/GoalsView';
import { BooksView } from './components/views/BooksView';
import { ItemModal } from './components/modals/ItemModal';
import { BookModal } from './components/modals/BookModal';
import { StatsDrawer } from './components/stats/StatsDrawer';
import { Sparkles, Plus, X } from 'lucide-react';
import { Horizon } from './types';

export const App: React.FC = () => {
  const {
    init,
    activeView,
    isItemModalOpen,
    closeModal,
    isBookModalOpen,
    closeBookModal,
    subGoalTipGoal,
    dismissSubGoalTip,
    openCreateModal,
  } = usePlannerStore();

  useEffect(() => {
    init();
  }, [init]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isItemModalOpen) closeModal();
        if (isBookModalOpen) closeBookModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isItemModalOpen, closeModal, isBookModalOpen, closeBookModal]);

  return (
    <div className="relative min-h-screen w-full bg-bg-deep text-text-primary flex flex-col tablet-l:flex-row overflow-hidden font-sans select-none">
      {/* Background Animated Gradient Waves */}
      <AmbientBackground />

      {/* Typographic Navigation Sidebar / Header */}
      <Navigation />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
        {activeView === 'today' && <TodayView />}
        {activeView === 'week' && <WeekView />}
        {activeView === 'month' && <MonthView />}
        {activeView === 'year' && <YearView />}
        {activeView === 'fiveYear' && <FiveYearView />}
        {activeView === 'goals' && <GoalsView />}
        {activeView === 'books' && <BooksView />}
      </main>

      {/* SUB-GOAL CREATION TIP TOAST */}
      {subGoalTipGoal && (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm w-full p-4 rounded-3xl bg-[#141B4E]/95 border border-accent-mint/40 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-accent-mint shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-wider">
                  Otomatik İlerleme İpucu
                </h4>
                <p className="text-xs text-text-secondary mt-1">
                  <span className="text-white font-bold">"{subGoalTipGoal.title}"</span> hedefine alt adımlar ekleyerek ilerlemeyi otomatik takip edin.
                </p>
              </div>
            </div>

            <button
              onClick={dismissSubGoalTip}
              className="text-text-muted hover:text-white p-1 rounded-lg"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => {
                let nextHorizon: Horizon = 'month';
                if (subGoalTipGoal.horizon === 'fiveYear') nextHorizon = 'year';
                else if (subGoalTipGoal.horizon === 'year') nextHorizon = 'month';
                else if (subGoalTipGoal.horizon === 'month') nextHorizon = 'week';

                dismissSubGoalTip();
                openCreateModal({
                  parentId: subGoalTipGoal.id,
                  horizon: nextHorizon,
                });
              }}
              className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-accent-mint text-bg-deep font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(46,230,182,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Alt Hedef Ekle</span>
            </button>

            <button
              onClick={dismissSubGoalTip}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white text-xs font-bold uppercase transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <ItemModal />
      <BookModal />
      <StatsDrawer />
    </div>
  );
};

export default App;
