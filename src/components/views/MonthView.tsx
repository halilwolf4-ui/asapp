import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { Item } from '../../types';
import {
  getMonthCalendarGrid,
  formatMonthYearTr,
  formatDayMonthTr,
  formatShortDayTr,
  formatIsoDateOnly,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
} from '../../utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus, Check, Clock, MapPin, Sparkles, Repeat, CheckCircle2 } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';

interface DraggableMonthTaskProps {
  item: Item;
  categoryColor?: string;
  isDone: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onFinish?: () => void;
}

const DraggableMonthTask: React.FC<DraggableMonthTaskProps> = ({
  item,
  categoryColor,
  isDone,
  onToggle,
  onEdit,
  onFinish,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group p-4 rounded-2xl transition-all duration-200 flex items-start gap-3.5 select-none ${
        isDragging
          ? 'opacity-30 scale-95'
          : isDone
          ? 'bg-white/[0.015] opacity-60'
          : 'bg-white/[0.035] hover:bg-white/[0.07] cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Status Toggle Button (Min 48px touch friendly wrapper) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`min-w-[34px] min-h-[34px] rounded-xl flex items-center justify-center transition-all ${
          isDone
            ? 'bg-accent-mint text-bg-deep shadow-[0_0_12px_rgba(46,230,182,0.4)]'
            : 'border-2 border-white/20 hover:border-accent-pink text-transparent'
        }`}
        aria-label={isDone ? 'Tamamlandı olarak işaretli' : 'Tamamla'}
      >
        <Check className="w-4 h-4 stroke-[3]" />
      </button>

      {/* Task Content */}
      <div
        className="flex-1 cursor-pointer min-w-0"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          {item.time && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-accent-pink tabular-nums">
              <Clock className="w-3 h-3" />
              {item.time}
            </span>
          )}
          <span
            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${categoryColor || '#FF3D7F'}1A`,
              color: categoryColor || '#FF3D7F',
            }}
          >
            Görev
          </span>
          {item.recurrenceGroupId && (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent-pink/15 text-accent-pink">
              <Repeat className="w-3 h-3" />
              <span>Tekrarlayan</span>
            </span>
          )}
        </div>

        <h4
          className={`text-base font-semibold text-white leading-snug break-words ${
            isDone ? 'line-through text-text-muted' : ''
          }`}
        >
          {item.title}
        </h4>

        {item.location && (
          <p className="flex items-center gap-1 text-xs text-text-muted mt-1">
            <MapPin className="w-3 h-3 text-text-muted" />
            <span>{item.location}</span>
          </p>
        )}
      </div>

      {!isDone && onFinish && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFinish();
          }}
          className="opacity-0 group-hover:opacity-100 px-2.5 py-1 rounded-xl bg-accent-mint/15 hover:bg-accent-mint/25 text-accent-mint text-[11px] font-black uppercase tracking-wider transition-all self-center shrink-0 border border-accent-mint/30 flex items-center gap-1"
          title={item.recurrenceGroupId ? 'Görevi bitir ve sonraki tekrarları sil' : 'Görevi bitir'}
        >
          <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
          <span>Bitir</span>
        </button>
      )}
    </div>
  );
};

interface DroppableDayCellProps {
  date: Date;
  dateStr: string;
  isSelected: boolean;
  isCurrentMonth: boolean;
  dayTasks: Item[];
  categories: { id: string; color: string }[];
  onSelect: () => void;
}

const DroppableDayCell: React.FC<DroppableDayCellProps> = ({
  date,
  dateStr,
  isSelected,
  isCurrentMonth,
  dayTasks,
  categories,
  onSelect,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  const hasTasks = dayTasks.length > 0;
  const allTasksDone = hasTasks && dayTasks.every((t) => t.status === 'done');

  return (
    <button
      ref={setNodeRef}
      onClick={onSelect}
      className={`min-h-[58px] tablet-p:min-h-[72px] tablet-l:min-h-[84px] p-2 rounded-2xl flex flex-col items-center justify-between transition-all duration-200 relative group select-none ${
        isOver
          ? 'bg-accent-mint/20 ring-2 ring-accent-mint scale-105 z-20'
          : isSelected
          ? 'bg-gradient-to-b from-accent-pink to-[#E0356D] text-white shadow-[0_8px_24px_rgba(255,61,127,0.4)] scale-[1.02] z-10'
          : isCurrentMonth
          ? 'bg-white/[0.025] hover:bg-white/[0.07] text-white/90'
          : 'bg-transparent text-text-muted/40 hover:text-text-muted/80'
      }`}
    >
      {/* Day Number (Large & Tabular) */}
      <span
        className={`text-lg tablet-p:text-xl tablet-l:text-2xl font-bold font-display tabular-nums ${
          isSelected ? 'text-white' : ''
        }`}
      >
        {date.getDate()}
      </span>

      {/* Task Indicators (Dots / Badge) */}
      <div className="flex items-center gap-1 mt-auto pb-1">
        {hasTasks && (
          <>
            {dayTasks.slice(0, 3).map((task, idx) => {
              const cat = categories.find((c) => c.id === task.categoryId);
              const dotColor = isSelected
                ? '#FFFFFF'
                : task.status === 'done'
                ? '#2EE6B6'
                : cat?.color || '#FF3D7F';
              return (
                <span
                  key={idx}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
              );
            })}
            {dayTasks.length > 3 && (
              <span
                className={`text-[9px] font-bold tabular-nums ${
                  isSelected ? 'text-white/90' : 'text-text-muted'
                }`}
              >
                +{dayTasks.length - 3}
              </span>
            )}
          </>
        )}
        {allTasksDone && !isSelected && (
          <span className="w-1.5 h-1.5 rounded-full bg-accent-mint ring-2 ring-accent-mint/30" />
        )}
      </div>
    </button>
  );
};

export const MonthView: React.FC = () => {
  const {
    items,
    categories,
    selectedDate,
    setSelectedDate,
    openCreateModal,
    openEditModal,
    toggleItemStatus,
    finishItemAndClearFutureRecurrences,
    moveItemDate,
  } = usePlannerStore();

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() =>
    selectedDate ? parseISO(selectedDate) : new Date()
  );
  const [activeDragItem, setActiveDragItem] = useState<Item | null>(null);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // Tablet hold-to-drag
      tolerance: 5,
    },
  });

  const sensors = useSensors(pointerSensor, touchSensor);

  const daysGrid = getMonthCalendarGrid(currentMonthDate);
  const selectedDateObj = parseISO(selectedDate);

  // Group items by date for the calendar dots
  const dayItemsMap = new Map<string, typeof items>();
  items.forEach((item) => {
    if (item.startDate) {
      const dKey = item.startDate.slice(0, 10);
      const list = dayItemsMap.get(dKey) || [];
      list.push(item);
      dayItemsMap.set(dKey, list);
    }
  });

  // Selected day items
  const selectedDayItems = (dayItemsMap.get(selectedDate) || []).sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });

  const completedCount = selectedDayItems.filter((i) => i.status === 'done').length;
  const dayProgress =
    selectedDayItems.length > 0 ? Math.round((completedCount / selectedDayItems.length) * 100) : 0;

  const weekDayHeaders = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CTS', 'PAZ'];

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find((i) => i.id === event.active.id);
    if (item) setActiveDragItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (over && active.id !== over.id) {
      const targetDate = String(over.id);
      moveItemDate(String(active.id), targetDate);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex flex-col tablet-l:flex-row h-full overflow-hidden">
        {/* LEFT / TOP: CALENDAR GRID (Typographic & Clean) */}
        <div className="flex-1 flex flex-col p-4 tablet-p:p-6 tablet-l:p-10 overflow-y-auto">
          {/* Month Navigation & Big Typographic Month Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] font-bold text-accent-pink block mb-1">
                AYLIK GÖRÜNÜM
              </span>
              <h2 className="text-4xl tablet-p:text-5xl tablet-l:text-6xl font-black font-display text-white tracking-tight capitalize">
                {formatMonthYearTr(currentMonthDate)}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonthDate(subMonths(currentMonthDate, 1))}
                className="w-12 h-12 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 text-white flex items-center justify-center transition-all active:scale-90"
                aria-label="Önceki Ay"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonthDate(addMonths(currentMonthDate, 1))}
                className="w-12 h-12 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 text-white flex items-center justify-center transition-all active:scale-90"
                aria-label="Sonraki Ay"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-3 text-center">
            {weekDayHeaders.map((dayName) => (
              <div
                key={dayName}
                className="text-xs uppercase tracking-widest font-black text-text-muted py-2"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* 7-column Calendar Grid (Droppable cells) */}
          <div className="grid grid-cols-7 gap-1.5 tablet-p:gap-2.5 flex-1 auto-rows-fr">
            {daysGrid.map(({ date, isCurrentMonth }) => {
              const dateStr = formatIsoDateOnly(date);
              const isSelected = isSameDay(date, selectedDateObj);
              const dayTasks = dayItemsMap.get(dateStr) || [];

              return (
                <DroppableDayCell
                  key={dateStr}
                  date={date}
                  dateStr={dateStr}
                  isSelected={isSelected}
                  isCurrentMonth={isCurrentMonth}
                  dayTasks={dayTasks}
                  categories={categories}
                  onSelect={() => setSelectedDate(dateStr)}
                />
              );
            })}
          </div>
        </div>

        {/* RIGHT (or BOTTOM on Mobile): SELECTED DAY DETAIL PANEL */}
        <div className="w-full tablet-l:w-96 border-t tablet-l:border-t-0 tablet-l:border-l border-white/10 bg-bg-surface/50 backdrop-blur-2xl flex flex-col p-6 tablet-p:p-8 shrink-0">
          {/* Selected Day Typographic Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-accent-pink block">
                {formatShortDayTr(selectedDateObj)} GÜNÜ
              </span>
              <h3 className="text-3xl tablet-p:text-4xl font-black font-display text-white tracking-tight">
                {formatDayMonthTr(selectedDateObj)}
              </h3>
            </div>

            {/* Progress Indicator */}
            {selectedDayItems.length > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black font-display tabular-nums text-accent-mint">
                  %{dayProgress}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                  {completedCount}/{selectedDayItems.length} Tamam
                </span>
              </div>
            )}
          </div>

          {/* Action: Add Task for this selected day */}
          <button
            onClick={() => openCreateModal({ horizon: 'day', date: selectedDate })}
            className="w-full min-h-touch py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mb-6 transition-all active:scale-98"
          >
            <Plus className="w-4 h-4 text-accent-pink stroke-[3]" />
            <span>Bu Güne Görev Ekle</span>
          </button>

          {/* Task List for Selected Day (Draggable onto other days!) */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {selectedDayItems.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white/[0.015] border border-white/5 text-text-muted">
                <Sparkles className="w-8 h-8 text-accent-pink/40 mb-3" />
                <p className="text-sm font-medium text-text-secondary">Bu güne ait görev yok</p>
                <p className="text-xs text-text-muted mt-1">Yukarıdaki butondan hemen ekleyebilirsiniz.</p>
              </div>
            ) : (
              selectedDayItems.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                const isDone = item.status === 'done';

                return (
                  <DraggableMonthTask
                    key={item.id}
                    item={item}
                    categoryColor={cat?.color}
                    isDone={isDone}
                    onToggle={() => toggleItemStatus(item.id)}
                    onEdit={() => openEditModal(item)}
                    onFinish={() => finishItemAndClearFutureRecurrences(item.id)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem ? (
            <div className="p-3 rounded-2xl bg-bg-card border border-accent-pink/60 text-white shadow-[0_12px_32px_rgba(255,61,127,0.4)] scale-105 rotate-2 cursor-grabbing pointer-events-none w-56">
              <span className="text-[10px] uppercase font-black text-accent-pink block mb-0.5">
                Güne Taşınıyor...
              </span>
              <p className="text-xs font-bold text-white line-clamp-1">{activeDragItem.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
