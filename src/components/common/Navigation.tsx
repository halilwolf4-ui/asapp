import React from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { ViewMode } from '../../types';
import { Plus, BarChart2, Undo2 } from 'lucide-react';

interface NavItem {
  id: ViewMode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'today', label: 'Bugün' },
  { id: 'week', label: 'Hafta' },
  { id: 'month', label: 'Ay' },
  { id: 'year', label: 'Yıl' },
  { id: 'fiveYear', label: '5 Yıl' },
  { id: 'goals', label: 'Hedefler' },
  { id: 'books', label: 'Kitaplık' },
];

export const Navigation: React.FC = () => {
  const {
    activeView,
    setActiveView,
    openCreateModal,
    setStatsOpen,
    lastDeletedItem,
    undoDelete,
  } = usePlannerStore();

  return (
    <nav className="relative z-20 flex flex-col justify-between py-4 tablet-l:py-8 px-4 tablet-l:px-6 w-full tablet-l:w-64 tablet-l:h-screen shrink-0 border-b tablet-l:border-b-0 tablet-l:border-r border-white/5 bg-bg-deep/40 backdrop-blur-xl">
      {/* Brand / Logo */}
      <div className="flex items-center justify-between tablet-l:flex-col tablet-l:items-start gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-black text-accent-pink block">
            ASAPP · TABLET
          </span>
          <h1 className="text-2xl tablet-l:text-3xl font-black tracking-tight text-white font-display">
            Asapp<span className="text-accent-mint">.</span>
          </h1>
        </div>

        {/* Undo Toast Notification if last deleted item exists */}
        {lastDeletedItem && (
          <button
            onClick={() => undoDelete()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-accent-coral/20 border border-accent-coral/40 text-white hover:bg-accent-coral/30 transition-colors animate-pulse"
            title="Silinen öğeyi geri al"
          >
            <Undo2 className="w-3.5 h-3.5 text-accent-coral" />
            <span>Geri Al</span>
          </button>
        )}
      </div>

      {/* Nav Tabs - Typographic Centric */}
      <div className="flex tablet-l:flex-col items-center tablet-l:items-start gap-2 tablet-l:gap-4 overflow-x-auto no-scrollbar py-2 tablet-l:py-6">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`min-h-[44px] tablet-l:min-h-[48px] px-3 tablet-l:px-0 py-1 transition-all duration-300 relative group flex items-center ${
                isActive
                  ? 'text-white font-extrabold text-lg tablet-l:text-2xl font-display'
                  : 'text-text-muted hover:text-text-secondary font-medium text-base tablet-l:text-lg'
              }`}
            >
              {/* Active Dot / Accent Bar */}
              {isActive && (
                <span className="hidden tablet-l:inline-block w-2 h-2 rounded-full bg-accent-pink mr-3.5 shadow-[0_0_12px_#FF3D7F]" />
              )}
              <span>{item.label}</span>
              {isActive && (
                <span className="tablet-l:hidden absolute bottom-0 left-2 right-2 h-0.5 bg-accent-pink rounded-full shadow-[0_0_8px_#FF3D7F]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Action Area: Quick Add & Stats */}
      <div className="flex tablet-l:flex-col gap-3 pt-2 tablet-l:pt-6 border-t border-white/5">
        <button
          onClick={() => openCreateModal()}
          className="flex-1 min-h-touch px-4 py-3 rounded-2xl bg-gradient-to-r from-accent-pink to-[#FF5E8E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,61,127,0.35)] hover:shadow-[0_12px_32px_rgba(255,61,127,0.5)] active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span className="tracking-wide uppercase text-xs">YENİ EKLE</span>
        </button>

        <button
          onClick={() => setStatsOpen(true)}
          className="min-h-touch px-3 py-2.5 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 text-text-secondary hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          title="İstatistikler ve Yedekleme"
        >
          <BarChart2 className="w-5 h-5 text-accent-mint" />
          <span className="hidden tablet-l:inline text-xs font-semibold tracking-wider uppercase">
            İstatistik
          </span>
        </button>
      </div>
    </nav>
  );
};

