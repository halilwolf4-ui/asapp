import React, { useState, useEffect, useRef } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { Horizon, Priority, ItemStatus } from '../../types';
import { HORIZON_LABELS } from '../../constants/categories';
import { calculateAllItemsProgress } from '../../utils/progressCalculator';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { X, Trash2, Lock, AlertTriangle, Repeat, Calendar, CheckCircle2 } from 'lucide-react';
import { formatIsoDateOnly, parseISO, addWeeks, addMonths } from '../../utils/dateUtils';
import { generateRecurrenceDates } from '../../utils/recurrenceUtils';

const WEEKDAY_OPTIONS = [
  { day: 1, label: 'Pzt', full: 'Pazartesi' },
  { day: 2, label: 'Sal', full: 'Salı' },
  { day: 3, label: 'Çar', full: 'Çarşamba' },
  { day: 4, label: 'Per', full: 'Perşembe' },
  { day: 5, label: 'Cum', full: 'Cuma' },
  { day: 6, label: 'Cmt', full: 'Cumartesi' },
  { day: 0, label: 'Paz', full: 'Pazar' },
];

export const ItemModal: React.FC = () => {
  const {
    isItemModalOpen,
    editingItem,
    modalPresetHorizon,
    modalPresetParentId,
    modalPresetDate,
    selectedDate,
    categories,
    items,
    closeModal,
    addItem,
    updateItem,
    deleteItem,
    finishItemAndClearFutureRecurrences,
    deleteRecurrenceSeries,
  } = usePlannerStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [horizon, setHorizon] = useState<Horizon>('day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [manualProgress, setManualProgress] = useState<number>(0);
  const [status, setStatus] = useState<ItemStatus>('todo');

  // Recurrence states
  const [recurrenceMode, setRecurrenceMode] = useState<'single' | 'recurring'>('single');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([1]);
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState<number[]>([1]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');
  const [recurrenceError, setRecurrenceError] = useState<string>('');

  const [showCascadeConfirm, setShowCascadeConfirm] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const bodyRef = useRef<HTMLFormElement>(null);

  // Dynamic visualViewport tracking for on-screen tablet keyboard
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, [isItemModalOpen]);

  const calculatedMap = calculateAllItemsProgress(items);
  const editingCalculated = editingItem ? calculatedMap.get(editingItem.id) : null;
  const hasChildren = editingCalculated ? !editingCalculated.isLeaf : false;

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description || '');
      setHorizon(editingItem.horizon);
      setStartDate(editingItem.startDate || '');
      setEndDate(editingItem.endDate || '');
      setTime(editingItem.time || '');
      setLocation(editingItem.location || '');
      setPriority(editingItem.priority);
      setCategoryId(editingItem.categoryId);
      setParentId(editingItem.parentId || '');
      setManualProgress(editingItem.manualProgress || 0);

      // Recurrence details
      if (editingItem.recurrenceGroupId) {
        setRecurrenceMode('recurring');
        setRecurrenceFrequency((editingItem.recurrence as 'daily' | 'weekly' | 'monthly') || 'weekly');
        setSelectedDaysOfWeek(editingItem.recurrenceDaysOfWeek || [1]);
        setSelectedDaysOfMonth(editingItem.recurrenceDaysOfMonth || [1]);
        setRecurrenceEndDate(editingItem.recurrenceEndDate || '');
      } else {
        setRecurrenceMode('single');
      }

      // If it has children, status is derived from children
      const calc = calculatedMap.get(editingItem.id);
      if (calc && !calc.isLeaf) {
        setStatus(calc.derivedStatus);
      } else {
        setStatus(editingItem.status);
      }
    } else {
      // Create defaults
      const initialDate = modalPresetDate || selectedDate;
      const initD = initialDate ? parseISO(initialDate) : new Date();

      setTitle('');
      setDescription('');
      setHorizon(modalPresetHorizon || 'day');
      setStartDate(initialDate);
      setEndDate('');
      setTime('');
      setLocation('');
      setPriority('medium');
      setCategoryId(categories[0]?.id || 'career');
      setParentId(modalPresetParentId || '');
      setManualProgress(0);
      setStatus('todo');

      setRecurrenceMode('single');
      setRecurrenceFrequency('weekly');
      setSelectedDaysOfWeek([initD.getDay()]);
      setSelectedDaysOfMonth([initD.getDate()]);
      setRecurrenceEndDate(formatIsoDateOnly(addMonths(initD, 1)));
      setRecurrenceError('');
    }
    setShowCascadeConfirm(false);
  }, [editingItem, isItemModalOpen, modalPresetHorizon, modalPresetParentId, modalPresetDate, selectedDate, categories]);

  if (!isItemModalOpen) return null;

  // Potential parent items (items with a broader horizon than current horizon)
  const horizonRanks: Record<Horizon, number> = {
    fiveYear: 5,
    year: 4,
    month: 3,
    week: 2,
    day: 1,
  };

  const eligibleParents = items.filter((item) => {
    if (editingItem && item.id === editingItem.id) return false;
    return horizonRanks[item.horizon] > horizonRanks[horizon];
  });

  const parentOptions: SelectOption[] = [
    { value: '', label: 'Bağımsız (Üst hedefi yok)' },
    ...eligibleParents.map((p) => ({
      value: p.id,
      label: p.title,
      horizonBadge: HORIZON_LABELS[p.horizon]?.short,
      depth: p.horizon === 'fiveYear' ? 0 : p.horizon === 'year' ? 1 : p.horizon === 'month' ? 2 : 3,
    })),
  ];

  const categoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
    color: c.color,
  }));

  const priorityOptions: SelectOption[] = [
    { value: 'low', label: 'Düşük Öncelik' },
    { value: 'medium', label: 'Orta Öncelik' },
    { value: 'high', label: 'Yüksek Öncelik' },
  ];

  const statusOptions: SelectOption[] = [
    { value: 'todo', label: 'Yapılacak' },
    { value: 'in_progress', label: 'Devam Ediyor' },
    { value: 'done', label: 'Tamamlandı' },
  ];

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleStatusChange = (newStatus: string) => {
    const next = newStatus as ItemStatus;
    if (hasChildren && next === 'done' && editingCalculated && editingCalculated.completedChildrenCount < editingCalculated.childrenCount) {
      setShowCascadeConfirm(true);
    } else {
      setStatus(next);
      setShowCascadeConfirm(false);
    }
  };

  const confirmCompleteAllDescendants = async () => {
    if (!editingItem) return;

    // Find all descendants of editingItem and mark them done
    const descendants: string[] = [];
    function collectChildren(pId: string) {
      items.forEach((it) => {
        if (it.parentId === pId) {
          descendants.push(it.id);
          collectChildren(it.id);
        }
      });
    }
    collectChildren(editingItem.id);

    for (const childId of descendants) {
      await updateItem(childId, { status: 'done', completedAt: new Date().toISOString() });
    }

    setStatus('done');
    setShowCascadeConfirm(false);
  };

  const handlePresetEndDate = (weeks?: number, months?: number) => {
    const base = startDate ? parseISO(startDate) : new Date();
    let target = base;
    if (weeks) target = addWeeks(target, weeks);
    if (months) target = addMonths(target, months);
    setRecurrenceEndDate(formatIsoDateOnly(target));
    setRecurrenceError('');
  };

  const toggleDayOfWeek = (day: number) => {
    setRecurrenceError('');
    if (selectedDaysOfWeek.includes(day)) {
      if (selectedDaysOfWeek.length > 1) {
        setSelectedDaysOfWeek(selectedDaysOfWeek.filter((d) => d !== day));
      }
    } else {
      setSelectedDaysOfWeek([...selectedDaysOfWeek, day].sort((a, b) => {
        const orderA = a === 0 ? 7 : a;
        const orderB = b === 0 ? 7 : b;
        return orderA - orderB;
      }));
    }
  };

  const toggleDayOfMonth = (day: number) => {
    setRecurrenceError('');
    if (selectedDaysOfMonth.includes(day)) {
      if (selectedDaysOfMonth.length > 1) {
        setSelectedDaysOfMonth(selectedDaysOfMonth.filter((d) => d !== day));
      }
    } else {
      setSelectedDaysOfMonth([...selectedDaysOfMonth, day].sort((a, b) => a - b));
    }
  };

  const previewDates =
    !editingItem && recurrenceMode === 'recurring' && recurrenceEndDate && startDate
      ? generateRecurrenceDates({
          frequency: recurrenceFrequency,
          daysOfWeek: selectedDaysOfWeek,
          daysOfMonth: selectedDaysOfMonth,
          startDate,
          endDate: recurrenceEndDate,
        })
      : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingItem) {
      updateItem(editingItem.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        horizon,
        startDate,
        endDate: endDate || undefined,
        time: time || undefined,
        location: location.trim() || undefined,
        priority,
        categoryId,
        parentId: parentId || undefined,
        manualProgress: hasChildren ? undefined : manualProgress,
        status: hasChildren ? editingCalculated?.derivedStatus || status : status,
      });
    } else {
      if (recurrenceMode === 'recurring') {
        if (!recurrenceEndDate) {
          setRecurrenceError('Lütfen tekrarların biteceği son tarihi belirleyin.');
          return;
        }
        if (recurrenceEndDate < startDate) {
          setRecurrenceError('Son tarih, başlangıç tarihinden önce olamaz.');
          return;
        }
        if (recurrenceFrequency === 'weekly' && selectedDaysOfWeek.length === 0) {
          setRecurrenceError('Lütfen en az bir gün seçin.');
          return;
        }
        if (recurrenceFrequency === 'monthly' && selectedDaysOfMonth.length === 0) {
          setRecurrenceError('Lütfen ayın en az bir gününü seçin.');
          return;
        }
      }

      addItem({
        title: title.trim(),
        description: description.trim() || undefined,
        horizon,
        startDate,
        endDate: endDate || undefined,
        time: time || undefined,
        location: location.trim() || undefined,
        priority,
        categoryId,
        parentId: parentId || undefined,
        manualProgress,
        status,
        recurrence: recurrenceMode === 'recurring' ? recurrenceFrequency : 'none',
        recurrenceDaysOfWeek:
          recurrenceMode === 'recurring' && recurrenceFrequency === 'weekly'
            ? selectedDaysOfWeek
            : undefined,
        recurrenceDaysOfMonth:
          recurrenceMode === 'recurring' && recurrenceFrequency === 'monthly'
            ? selectedDaysOfMonth
            : undefined,
        recurrenceEndDate: recurrenceMode === 'recurring' ? recurrenceEndDate : undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 tablet-p:p-6 bg-black/80 backdrop-blur-md overflow-hidden">
      <div
        className="bg-[#101744] border border-white/15 w-full max-w-xl rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden transition-all duration-200"
        style={{
          maxHeight: viewportHeight ? `${Math.min(viewportHeight - 24, 760)}px` : '92dvh',
        }}
      >
        {/* MODAL HEADER (Shrink-0) */}
        <div className="p-6 pb-4 border-b border-white/10 shrink-0 relative flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-accent-pink block mb-1">
              {editingItem ? 'ÖĞEYİ DÜZENLE' : 'YENİ HEDEF VEYA GÖREV'}
            </span>
            <h2 className="text-2xl tablet-p:text-3xl font-black font-display text-white tracking-tight">
              {editingItem ? 'Hedef / Görev Ayarları' : 'Planına Yeni Bir Adım Ekle'}
            </h2>
          </div>

          <button
            onClick={closeModal}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL SCROLLABLE BODY (flex-1 overflow-y-auto) */}
        <form id="item-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6" ref={bodyRef}>
          {/* Horizon Selection Buttons */}
          <div>
            <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
              Ölçek (Horizon)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['day', 'week', 'month', 'year', 'fiveYear'] as Horizon[]).map((hor) => {
                const info = HORIZON_LABELS[hor];
                const isSelected = horizon === hor;
                return (
                  <button
                    key={hor}
                    type="button"
                    onClick={() => {
                      setHorizon(hor);
                      if (parentId) {
                        const currentParent = items.find((p) => p.id === parentId);
                        if (currentParent && horizonRanks[currentParent.horizon] <= horizonRanks[hor]) {
                          setParentId('');
                        }
                      }
                    }}
                    className={`min-h-[48px] py-2 px-1 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-accent-pink text-white shadow-[0_0_16px_rgba(255,61,127,0.4)]'
                        : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{info.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
              Başlık *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Portfolyo sitesini canlıya al..."
              value={title}
              onFocus={handleFocus}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[48px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-3 text-base text-white placeholder-text-muted/60 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
              Açıklama / Notlar
            </label>
            <textarea
              rows={2}
              placeholder="Ek notlar veya detaylar..."
              value={description}
              onFocus={handleFocus}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-3 text-sm text-white placeholder-text-muted/60 focus:outline-none transition-colors"
            />
          </div>

          {/* Parent Goal Selection (Custom Dropdown with Search & Hierarchy Indent) */}
          <div>
            <CustomSelect
              label="Üst Hedefe Bağla (Hiyerarşi)"
              value={parentId}
              onChange={(val) => setParentId(val)}
              options={parentOptions}
              searchable={eligibleParents.length > 3}
              placeholder="Bağımsız (Üst hedefi yok)"
            />
          </div>

          {/* Category & Priority (Custom Dropdowns) */}
          <div className="grid grid-cols-1 tablet-p:grid-cols-2 gap-4">
            <CustomSelect
              label="Kategori"
              value={categoryId}
              onChange={(val) => setCategoryId(val)}
              options={categoryOptions}
            />

            <CustomSelect
              label="Öncelik"
              value={priority}
              onChange={(val) => setPriority(val as Priority)}
              options={priorityOptions}
            />
          </div>

          {/* Dates & Times Grid */}
          <div className="grid grid-cols-1 tablet-p:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                {recurrenceMode === 'recurring' ? 'Başlangıç Tarihi' : 'Tarih'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none"
              />
            </div>

            {horizon === 'day' ? (
              <div>
                <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                  Saat (Opsiyonel)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
                  Bitiş Tarihi (Opsiyonel)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* RECURRENCE SECTION */}
          {editingItem ? (
            editingItem.recurrenceGroupId && (
              <div className="p-4 rounded-2xl bg-accent-pink/10 border border-accent-pink/30 flex items-start gap-3">
                <Repeat className="w-5 h-5 text-accent-pink shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase text-white tracking-wider">
                    Tekrarlayan Görev Serisi
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Bu görev tekrarlayan bir serinin parçasıdır. Aşağıdaki "Bitir" butonuna basarak bu görevi %100 tamamlayabilir ve kalan gelecek tekrarları silebilirsiniz.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-3 pt-2">
              <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block">
                Tekrar Durumu (Sıklık)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRecurrenceMode('single');
                    setRecurrenceError('');
                  }}
                  className={`min-h-[46px] px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    recurrenceMode === 'single'
                      ? 'bg-accent-pink text-white shadow-[0_0_16px_rgba(255,61,127,0.4)]'
                      : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Bir Defalık</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecurrenceMode('recurring');
                    setRecurrenceError('');
                  }}
                  className={`min-h-[46px] px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    recurrenceMode === 'recurring'
                      ? 'bg-accent-pink text-white shadow-[0_0_16px_rgba(255,61,127,0.4)]'
                      : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                  <span>Her (Tekrarlayan)</span>
                </button>
              </div>

              {/* If Recurring is selected: Frequency, Days & End Date */}
              {recurrenceMode === 'recurring' && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 transition-all">
                  {/* Frequency: Gün, Hafta, Ay */}
                  <div>
                    <label className="text-[11px] uppercase font-extrabold tracking-wider text-accent-pink block mb-2">
                      Tekrar Sıklığı
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'daily', label: 'Her Gün' },
                          { id: 'weekly', label: 'Her Hafta' },
                          { id: 'monthly', label: 'Her Ay' },
                        ] as const
                      ).map((freq) => (
                        <button
                          key={freq.id}
                          type="button"
                          onClick={() => {
                            setRecurrenceFrequency(freq.id);
                            setRecurrenceError('');
                          }}
                          className={`min-h-[40px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                            recurrenceFrequency === freq.id
                              ? 'bg-accent-pink text-white shadow-[0_0_12px_rgba(255,61,127,0.3)]'
                              : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* If Weekly: Weekday Pills (multi-select) */}
                  {recurrenceFrequency === 'weekly' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] uppercase font-extrabold tracking-wider text-text-muted">
                          Tekrarlanacak Günler (Birden fazla seçilebilir)
                        </label>
                        <span className="text-[10px] text-text-muted">
                          {selectedDaysOfWeek.length} gün seçildi
                        </span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {WEEKDAY_OPTIONS.map((w) => {
                          const isSelected = selectedDaysOfWeek.includes(w.day);
                          return (
                            <button
                              key={w.day}
                              type="button"
                              onClick={() => toggleDayOfWeek(w.day)}
                              className={`min-h-[42px] rounded-xl text-xs font-extrabold flex flex-col items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-accent-pink text-white shadow-[0_0_10px_rgba(255,61,127,0.4)]'
                                  : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10'
                              }`}
                              title={w.full}
                            >
                              <span>{w.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* If Monthly: Day of Month Buttons (1..31 multi-select) */}
                  {recurrenceFrequency === 'monthly' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] uppercase font-extrabold tracking-wider text-text-muted">
                          Ayın Kaçıncı Günleri? (Birden fazla seçilebilir)
                        </label>
                        <span className="text-[10px] text-text-muted">
                          {selectedDaysOfMonth.length} gün seçildi
                        </span>
                      </div>
                      <div className="grid grid-cols-7 tablet-p:grid-cols-10 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-black/25 rounded-xl border border-white/5">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                          const isSelected = selectedDaysOfMonth.includes(dayNum);
                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => toggleDayOfMonth(dayNum)}
                              className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                                isSelected
                                  ? 'bg-accent-pink text-white shadow-[0_0_8px_rgba(255,61,127,0.4)]'
                                  : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {dayNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* End Date (Görev Son Tarihi - Required for recurrence!) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] uppercase font-extrabold tracking-wider text-text-muted flex items-center gap-1">
                        <span>Görev Son Tarihi (Tekrarların Biteceği Tarih) *</span>
                      </label>
                      <span className="text-[10px] text-accent-coral font-bold">Zorunlu</span>
                    </div>
                    <input
                      type="date"
                      required
                      min={startDate || undefined}
                      value={recurrenceEndDate}
                      onChange={(e) => {
                        setRecurrenceEndDate(e.target.value);
                        setRecurrenceError('');
                      }}
                      className="w-full min-h-[46px] bg-white/5 border border-white/10 focus:border-accent-pink rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    />

                    {/* Quick presets for end date */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-text-muted uppercase">Hızlı:</span>
                      <button
                        type="button"
                        onClick={() => handlePresetEndDate(2, undefined)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-text-secondary hover:text-white transition-colors"
                      >
                        +2 Hafta
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetEndDate(undefined, 1)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-text-secondary hover:text-white transition-colors"
                      >
                        +1 Ay
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetEndDate(undefined, 3)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-text-secondary hover:text-white transition-colors"
                      >
                        +3 Ay
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetEndDate(undefined, 6)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-text-secondary hover:text-white transition-colors"
                      >
                        +6 Ay
                      </button>
                    </div>
                  </div>

                  {/* Recurrence Summary & Estimation Note */}
                  {previewDates.length > 0 && (
                    <div className="p-3 rounded-xl bg-accent-mint/10 border border-accent-mint/20 text-xs text-accent-mint flex items-center justify-between">
                      <span>
                        {recurrenceFrequency === 'daily' && '📅 Her Gün'}
                        {recurrenceFrequency === 'weekly' &&
                          `📅 Her Hafta (${selectedDaysOfWeek
                            .map((d) => WEEKDAY_OPTIONS.find((w) => w.day === d)?.label)
                            .filter(Boolean)
                            .join(', ')})`}
                        {recurrenceFrequency === 'monthly' &&
                          `📅 Her Ay (${selectedDaysOfMonth.join(', ')}. günleri)`}
                      </span>
                      <span className="font-extrabold tabular-nums bg-accent-mint/20 px-2 py-0.5 rounded-full">
                        {previewDates.length} adet görev
                      </span>
                    </div>
                  )}

                  {recurrenceError && (
                    <p className="text-xs text-accent-coral font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{recurrenceError}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Progress & Status Section (Automatic vs Manual Rule) */}
          {editingItem && (
            <div className="pt-4 border-t border-white/10 space-y-4">
              {hasChildren && editingCalculated ? (
                /* LOCKED AUTOMATIC PROGRESS INDICATOR */
                <div className="p-4 rounded-2xl bg-accent-mint/10 border border-accent-mint/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-accent-mint flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Otomatik İlerleme</span>
                    </span>
                    <span className="text-lg font-black font-display text-accent-mint tabular-nums">
                      %{editingCalculated.progress}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary">
                    {editingCalculated.completedChildrenCount} / {editingCalculated.childrenCount} alt hedef tamamlandı.
                    İlerleme alt hedeflerden otomatik hesaplanır.
                  </p>

                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-accent-mint rounded-full transition-all duration-300"
                      style={{ width: `${editingCalculated.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                /* LEAF ITEM: ACTIVE MANUAL SLIDER */
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted">
                      Manuel İlerleme (Yaprak Öğe)
                    </label>
                    <span className="text-sm font-black text-accent-mint tabular-nums">
                      %{status === 'done' ? 100 : manualProgress}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    disabled={status === 'done'}
                    value={status === 'done' ? 100 : manualProgress}
                    onChange={(e) => setManualProgress(Number(e.target.value))}
                    className="w-full accent-accent-mint cursor-pointer"
                  />
                </div>
              )}

              {/* Status Selector */}
              <div>
                <CustomSelect
                  label={hasChildren ? 'Durum (Alt hedeflerden türetilir)' : 'Durum'}
                  value={status}
                  onChange={handleStatusChange}
                  options={statusOptions}
                />
              </div>

              {/* Cascade Complete Confirmation Banner */}
              {showCascadeConfirm && (
                <div className="p-4 rounded-2xl bg-accent-coral/20 border border-accent-coral/40 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-accent-coral shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-white">
                        Alt Hedefler Henüz Bitmedi
                      </h4>
                      <p className="text-xs text-text-secondary mt-1">
                        Bu hedefin {editingCalculated?.completedChildrenCount}/{editingCalculated?.childrenCount} alt adımı tamamlandı.
                        Tüm alt hedefleri de "Tamamlandı" olarak işaretlemek ister misiniz?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={confirmCompleteAllDescendants}
                      className="px-3 py-2 rounded-xl bg-accent-coral text-white text-xs font-black uppercase tracking-wider"
                    >
                      Evet, Hepsini Tamamla
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCascadeConfirm(false)}
                      className="px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-bold uppercase"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* MODAL STICKY FOOTER (Shrink-0 Bottom Pinned) */}
        <div className="p-4 px-6 border-t border-white/10 bg-[#0E143E] shrink-0 flex flex-wrap items-center justify-between gap-3">
          {editingItem ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  deleteItem(editingItem.id);
                  closeModal();
                }}
                className="min-h-[46px] px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-accent-coral/20 text-accent-coral font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                title="Sadece bu görevi sil"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden tablet-p:inline">Sil</span>
              </button>

              {editingItem.recurrenceGroupId && (
                <button
                  type="button"
                  onClick={() => {
                    deleteRecurrenceSeries(editingItem.recurrenceGroupId!);
                    closeModal();
                  }}
                  className="min-h-[46px] px-3.5 py-2.5 rounded-2xl bg-accent-coral/10 hover:bg-accent-coral/20 text-accent-coral border border-accent-coral/20 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  title="Tüm tekrarlayan seriyi sil"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Tüm Seriyi Sil</span>
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            {editingItem && (
              <button
                type="button"
                onClick={() => {
                  finishItemAndClearFutureRecurrences(editingItem.id);
                  closeModal();
                }}
                className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-accent-mint/15 hover:bg-accent-mint/25 text-accent-mint border border-accent-mint/30 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-[0_0_16px_rgba(46,230,182,0.15)]"
                title="Görevi %100 tamamlar ve varsa gelecekteki tekrarları siler"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingItem.recurrenceGroupId ? 'Bitir (%100 & Sonrakileri Sil)' : 'Bitir (%100)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="min-h-[46px] px-4 py-2.5 rounded-2xl border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              form="item-form"
              className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-gradient-to-r from-accent-pink to-[#FF5E8E] text-white font-black text-xs uppercase tracking-wider shadow-[0_8px_24px_rgba(255,61,127,0.35)] hover:shadow-[0_12px_32px_rgba(255,61,127,0.5)] active:scale-95 transition-all"
            >
              {editingItem ? 'Kaydet' : 'Hedefi / Görevi Oluştur'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
