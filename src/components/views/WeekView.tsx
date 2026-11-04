import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { Item } from '../../types';
import {
  getDaysOfWeek,
  formatIsoDateOnly,
  formatShortDayTr,
  formatDayMonthTr,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from '../../utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus, Check, Clock, Repeat, CheckCircle2 } from 'lucide-react';
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

interface DraggableTaskProps {
  item: Item;
  categoryColor?: string;
  isDone: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onFinish?: () => void;
}

const DraggableTask: React.FC<DraggableTaskProps> = ({
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
      className={`group p-3 rounded-2xl transition-all duration-200 select-none ${
        isDragging
          ? 'opacity-30 scale-95'
          : isDone
          ? 'bg-white/[0.015] opacity-50'
          : 'bg-white/[0.04] hover:bg-white/[0.08] hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`min-w-[24px] min-h-[24px] rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
            isDone
              ? 'bg-accent-mint text-bg-deep'
              : 'border border-white/20 hover:border-accent-pink text-transparent'
          }`}
          aria-label="Tamamla"
        >
          <Check className="w-3 h-3 stroke-[3]" />
        </button>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <div className="flex items-center justify-between gap-1.5 mb-0.5">
            <div className="flex items-center gap-1.5">
              {item.time && (
                <span className="flex items-center gap-0.5 text-[10px] font-black text-accent-pink tabular-nums">
                  <Clock className="w-2.5 h-2.5" />
                  {item.time}
                </span>
              )}
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: categoryColor || '#FF3D7F' }}
              />
              {item.recurrenceGroupId && (
                <span title="Tekrarlayan Görev">
                  <Repeat className="w-2.5 h-2.5 text-accent-pink" />
                </span>
              )}
            </div>

            {!isDone && onFinish && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFinish();
                }}
                className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded-md bg-accent-mint/20 hover:bg-accent-mint/30 text-accent-mint text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-0.5"
                title={item.recurrenceGroupId ? "Görevi bitir ve sonraki tekrarları sil" : "Görevi bitir"}
              >
                <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                <span>Bitir</span>
              </button>
            )}
          </div>

          <p
            className={`text-xs font-semibold text-white leading-snug line-clamp-2 ${
              isDone ? 'line-through text-text-muted' : ''
            }`}
          >
            {item.title}
          </p>
        </div>
      </div>
    </div>
  );
};

interface DroppableColumnProps {
  day: Date;
  dateStr: string;
  isSelected: boolean;
  isToday: boolean;
  dayItems: Item[];
  categories: { id: string; color: string }[];
  onSelectDay: () => void;
  onAddTask: () => void;
  onToggleItem: (id: string) => void;
  onEditItem: (item: Item) => void;
  onFinishItem: (id: string) => void;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  day,
  dateStr,
  isSelected,
  isToday,
  dayItems,
  categories,
  onSelectDay,
  onAddTask,
  onToggleItem,
  onEditItem,
  onFinishItem,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  const completedCount = dayItems.filter((i) => i.status === 'done').length;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-3xl transition-all duration-300 min-w-[155px] tablet-l:min-w-[165px] flex-1 overflow-hidden select-none ${
        isOver
          ? 'bg-accent-mint/15 ring-2 ring-accent-mint shadow-[0_0_24px_rgba(46,230,182,0.25)]'
          : isSelected
          ? 'bg-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.35)] ring-1 ring-accent-pink/50'
          : 'bg-white/[0.025] hover:bg-white/[0.045]'
      }`}
    >
      {/* Column Header (Click to select day) */}
      <div
        onClick={onSelectDay}
        className={`p-4 cursor-pointer flex flex-col items-center justify-center transition-colors ${
          isSelected
            ? 'bg-gradient-to-b from-accent-pink/30 to-transparent'
            : 'hover:bg-white/5'
        }`}
      >
        <span className="text-[11px] uppercase tracking-wider font-black text-text-muted">
          {formatShortDayTr(day)}
        </span>
        <span
          className={`text-3xl font-black font-display tabular-nums mt-0.5 ${
            isToday
              ? 'text-accent-mint'
              : isSelected
              ? 'text-white'
              : 'text-text-secondary'
          }`}
        >
          {day.getDate()}
        </span>

        {/* Counter Pill */}
        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-text-muted">
          <span className="text-accent-mint tabular-nums">{completedCount}</span>/
          <span className="tabular-nums">{dayItems.length}</span>
        </div>
      </div>

      {/* Task List in Droppable Column */}
      <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
        {dayItems.map((item) => {
          const cat = categories.find((c) => c.id === item.categoryId);
          return (
            <DraggableTask
              key={item.id}
              item={item}
              categoryColor={cat?.color}
              isDone={item.status === 'done'}
              onToggle={() => onToggleItem(item.id)}
              onEdit={() => onEditItem(item)}
              onFinish={() => onFinishItem(item.id)}
            />
          );
        })}
      </div>

      {/* Bottom Quick Add */}
      <button
        onClick={onAddTask}
        className="p-3 border-t border-white/5 hover:bg-white/5 text-text-muted hover:text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors min-h-[44px]"
        title="Bu güne görev ekle"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider">Ekle</span>
      </button>
    </div>
  );
};

export const WeekView: React.FC = () => {
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

  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(() =>
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
      delay: 250, // 250ms press delay avoids conflicting with normal scrolling
      tolerance: 5,
    },
  });

  const sensors = useSensors(pointerSensor, touchSensor);

  const weekDays = getDaysOfWeek(currentWeekDate);
  const selectedDateObj = parseISO(selectedDate);

  // Group items by day
  const itemsByDate = new Map<string, typeof items>();
  items.forEach((item) => {
    if (item.startDate) {
      const dKey = item.startDate.slice(0, 10);
      const list = itemsByDate.get(dKey) || [];
      list.push(item);
      dayItemsByDate(list, dKey);
    }
  });

  function dayItemsByDate(list: typeof items, dKey: string) {
    itemsByDate.set(dKey, list);
  }

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
      <div className="flex-1 flex flex-col p-4 tablet-p:p-6 tablet-l:p-10 overflow-hidden h-full">
        {/* Week Header & Nav */}
        <div className="flex items-end justify-between mb-6 shrink-0">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-accent-pink block mb-1">
              HAFTALIK GÖRÜNÜM
            </span>
            <h2 className="text-3xl tablet-p:text-4xl tablet-l:text-5xl font-black font-display text-white tracking-tight">
              {formatDayMonthTr(weekDays[0])} — {formatDayMonthTr(weekDays[6])}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeekDate(subWeeks(currentWeekDate, 1))}
              className="w-12 h-12 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 text-white flex items-center justify-center transition-all active:scale-90"
              aria-label="Önceki Hafta"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentWeekDate(addWeeks(currentWeekDate, 1))}
              className="w-12 h-12 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 text-white flex items-center justify-center transition-all active:scale-90"
              aria-label="Sonraki Hafta"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 7-Day Droppable Grid with comfortable scroll & spacious columns */}
        <div className="flex gap-3 tablet-l:gap-4 flex-1 overflow-x-auto pb-4 pt-1 no-scrollbar">
          {weekDays.map((day) => {
            const dateStr = formatIsoDateOnly(day);
            const isSelected = isSameDay(day, selectedDateObj);
            const isToday = isSameDay(day, new Date());
            const dayItems = (itemsByDate.get(dateStr) || []).sort((a, b) => {
              if (a.time && b.time) return a.time.localeCompare(b.time);
              if (a.time) return -1;
              if (b.time) return 1;
              return 0;
            });

            return (
              <DroppableColumn
                key={dateStr}
                day={day}
                dateStr={dateStr}
                isSelected={isSelected}
                isToday={isToday}
                dayItems={dayItems}
                categories={categories}
                onSelectDay={() => setSelectedDate(dateStr)}
                onAddTask={() => openCreateModal({ horizon: 'day', date: dateStr })}
                onToggleItem={toggleItemStatus}
                onEditItem={openEditModal}
                onFinishItem={finishItemAndClearFutureRecurrences}
              />
            );
          })}
        </div>

        {/* Drag Overlay with visual feedback */}
        <DragOverlay>
          {activeDragItem ? (
            <div className="p-3 rounded-2xl bg-bg-card border border-accent-pink/60 text-white shadow-[0_12px_32px_rgba(255,61,127,0.4)] scale-105 rotate-2 cursor-grabbing pointer-events-none w-52">
              <span className="text-[10px] uppercase font-black text-accent-pink block mb-0.5">
                Taşınıyor...
              </span>
              <p className="text-xs font-bold text-white line-clamp-1">{activeDragItem.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
