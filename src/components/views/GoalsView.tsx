import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { CalculatedItem, Horizon } from '../../types';
import { buildHierarchyTree } from '../../utils/progressCalculator';
import { HORIZON_LABELS } from '../../constants/categories';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Target,
  Trash2,
  Edit,
  Check,
  Filter,
  Repeat,
  CheckCircle2,
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const {
    items,
    categories,
    openCreateModal,
    openEditModal,
    deleteItem,
    toggleItemStatus,
    finishItemAndClearFutureRecurrences,
  } = usePlannerStore();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(['goal-5y-career', 'goal-1y-portfolio', 'goal-1m-website', 'goal-5y-health'])
  );

  const [filterHorizon, setFilterHorizon] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const tree = buildHierarchyTree(items);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter root items: display if root matches or any child matches
  function matchesFilter(node: CalculatedItem): boolean {
    const horizonMatch = filterHorizon === 'all' || node.horizon === filterHorizon;
    const categoryMatch = filterCategory === 'all' || node.categoryId === filterCategory;
    if (horizonMatch && categoryMatch) return true;
    if (node.children && node.children.some(matchesFilter)) return true;
    return false;
  }

  const filteredRoots = tree.filter(matchesFilter);

  // Recursive tree node renderer
  const renderNode = (node: CalculatedItem, depth = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const cat = categories.find((c) => c.id === node.categoryId);
    const horizonInfo = HORIZON_LABELS[node.horizon] || {
      label: node.horizon,
      short: node.horizon,
    };
    const isDone = node.derivedStatus === 'done' || node.progress === 100;

    return (
      <div key={node.id} className="relative group/item">
        {/* Connection line for child items */}
        {depth > 0 && (
          <div className="absolute -left-4 top-8 w-4 h-px bg-white/10 pointer-events-none group-hover/item:bg-accent-mint/40 transition-colors" />
        )}

        <div
          className={`p-4 tablet-p:p-5 rounded-3xl transition-all duration-200 mb-3 ${
            depth === 0
              ? 'bg-white/[0.04] hover:bg-white/[0.07] shadow-[0_4px_24px_rgba(0,0,0,0.25)]'
              : 'bg-white/[0.02] hover:bg-white/[0.05]'
          }`}
        >
          <div className="flex flex-col tablet-p:flex-row tablet-p:items-center justify-between gap-4">
            {/* Left: Expand toggle OR Leaf Checkbox, Title, Horizon pill, Category */}
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="min-w-[48px] min-h-[48px] rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center shrink-0 transition-colors"
                  aria-label={isExpanded ? 'Daralt' : 'Genişlet'}
                  title={isExpanded ? 'Alt hedefleri gizle' : 'Alt hedefleri göster'}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-accent-pink stroke-[2.5]" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-text-muted stroke-[2.5]" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => toggleItemStatus(node.id)}
                  className={`min-w-[48px] min-h-[48px] rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    isDone
                      ? 'bg-accent-mint text-bg-deep shadow-[0_0_16px_rgba(46,230,182,0.4)]'
                      : 'border-2 border-white/20 hover:border-accent-pink text-transparent'
                  }`}
                  aria-label="Yapıldı olarak işaretle"
                  title="Yapıldı olarak işaretle"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                </button>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {/* Horizon Pill */}
                  <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-white">
                    {horizonInfo.short}
                  </span>

                  {/* Category Pill */}
                  <span
                    className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${cat?.color || '#FF3D7F'}22`,
                      color: cat?.color || '#FF3D7F',
                    }}
                  >
                    {cat?.name || 'Genel'}
                  </span>

                  {/* Date range if present */}
                  {node.startDate && (
                    <span className="text-[11px] text-text-muted tabular-nums">
                      {node.startDate.slice(0, 10)} {node.endDate ? `→ ${node.endDate.slice(0, 10)}` : ''}
                    </span>
                  )}

                  {node.recurrenceGroupId && (
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent-pink/15 text-accent-pink">
                      <Repeat className="w-3 h-3" />
                      <span>Tekrarlayan</span>
                    </span>
                  )}
                </div>

                <h3
                  className={`text-lg tablet-p:text-xl font-bold font-display text-white tracking-tight cursor-pointer hover:text-accent-pink transition-colors ${
                    isDone ? 'line-through text-text-muted' : ''
                  }`}
                  onClick={() => openEditModal(node)}
                >
                  {node.title}
                </h3>

                {node.description && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {node.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Progress Ring/Bar + Percentage + Actions */}
            <div className="flex items-center justify-between tablet-p:justify-end gap-5 shrink-0 pt-2 tablet-p:pt-0 border-t tablet-p:border-t-0 border-white/5">
              {/* Progress Display */}
              <div className="flex items-center gap-3">
                <div className="w-24 tablet-p:w-32">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] uppercase font-black text-text-muted tracking-wider">
                      {hasChildren ? `${node.completedChildrenCount}/${node.childrenCount} Alt Hedef` : 'İlerleme'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-mint to-[#24C99F] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(46,230,182,0.4)]"
                      style={{ width: `${node.progress}%` }}
                    />
                  </div>
                </div>

                <span className="text-2xl tablet-p:text-3xl font-black font-display tabular-nums text-accent-mint w-14 text-right">
                  %{node.progress}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 opacity-80 group-hover/item:opacity-100 transition-opacity">
                {/* Finish / Complete Button */}
                {node.progress < 100 && (
                  <button
                    onClick={() => finishItemAndClearFutureRecurrences(node.id)}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-accent-mint/15 hover:bg-accent-mint/25 text-accent-mint text-xs font-bold flex items-center gap-1.5 transition-colors border border-accent-mint/20"
                    title={node.recurrenceGroupId ? "Görevi bitir ve sonraki tekrarları sil" : "Görevi %100 tamamla"}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="text-[11px] uppercase tracking-wider font-extrabold hidden tablet-p:inline">
                      Bitir
                    </span>
                  </button>
                )}

                {/* Add Child Goal Button */}
                <button
                  onClick={() => {
                    let nextHorizon: Horizon = 'day';
                    if (node.horizon === 'fiveYear') nextHorizon = 'year';
                    else if (node.horizon === 'year') nextHorizon = 'month';
                    else if (node.horizon === 'month') nextHorizon = 'week';
                    else if (node.horizon === 'week') nextHorizon = 'day';

                    openCreateModal({
                      horizon: nextHorizon,
                      parentId: node.id,
                    });
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-accent-pink/15 hover:bg-accent-pink/25 text-accent-pink text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Alt Hedef / Görev Ekle"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span className="text-[11px] uppercase tracking-wider font-extrabold hidden tablet-p:inline">
                    Alt Adım
                  </span>
                </button>

                <button
                  onClick={() => openEditModal(node)}
                  className="min-w-[44px] min-h-[44px] rounded-xl text-text-muted hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
                  title="Düzenle"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteItem(node.id)}
                  className="min-w-[44px] min-h-[44px] rounded-xl text-text-muted hover:text-accent-coral hover:bg-white/5 flex items-center justify-center transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Children Sub-Tree */}
        {hasChildren && isExpanded && (
          <div className="pl-3 tablet-p:pl-6 relative ml-2 border-l border-white/10 space-y-2">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 tablet-p:p-8 tablet-l:p-12 overflow-y-auto max-w-6xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col tablet-p:flex-row tablet-p:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-accent-mint block mb-1">
            HİYERARŞİK VİZYON AĞACI
          </span>
          <h2 className="text-4xl tablet-p:text-5xl font-black font-display text-white tracking-tight">
            Hedefler & İlerleme
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            5 Yıllık vizyonlardan günlük görevlere uzanan zincirleme otomatik ilerleme.
          </p>
        </div>

        {/* Action: New Grand Goal */}
        <button
          onClick={() => openCreateModal({ horizon: 'fiveYear' })}
          className="min-h-touch px-5 py-3 rounded-2xl bg-gradient-to-r from-accent-mint to-[#18B88E] text-bg-deep font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(46,230,182,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>YENİ BÜYÜK HEDEF EKLE</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8 p-3 rounded-2xl bg-white/[0.02]">
        <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-accent-pink" />
          <span>Ölçek:</span>
        </div>

        {['all', 'fiveYear', 'year', 'month', 'week'].map((hor) => (
          <button
            key={hor}
            onClick={() => setFilterHorizon(hor)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
              filterHorizon === hor
                ? 'bg-accent-pink text-white shadow-[0_0_12px_rgba(255,61,127,0.3)]'
                : 'text-text-muted hover:text-white bg-white/5'
            }`}
          >
            {hor === 'all' ? 'Tümü' : HORIZON_LABELS[hor]?.short || hor}
          </button>
        ))}

        <div className="h-4 w-px bg-white/10 mx-2 hidden tablet-p:block" />

        <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider">
          <span>Kategori:</span>
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="min-h-[40px] bg-[#141B4E] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="all">Tüm Kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tree List */}
      <div className="space-y-4">
        {filteredRoots.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/[0.015] border border-white/5">
            <Target className="w-10 h-10 text-accent-mint/40 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">Filtrelere uygun hedef bulunamadı</h4>
            <p className="text-xs text-text-muted mt-1">
              Filtreleri temizleyebilir veya yeni bir hedef ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          filteredRoots.map((root) => renderNode(root, 0))
        )}
      </div>
    </div>
  );
};
