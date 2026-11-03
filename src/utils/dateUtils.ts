import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  parseISO,
} from 'date-fns';
import { tr } from 'date-fns/locale';

export const trLocale = tr;

export function formatFullDateTr(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEE, d MMMM yyyy', { locale: tr });
}

export function formatDayMonthTr(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMMM', { locale: tr });
}

export function formatMonthYearTr(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMMM yyyy', { locale: tr });
}

export function formatShortDayTr(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEE', { locale: tr });
}

export function formatIsoDateOnly(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Returns Monday to Sunday dates for the given date's week
 */
export function getDaysOfWeek(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

/**
 * Returns calendar grid days for month view (including padded days from prev/next month)
 */
export function getMonthCalendarGrid(date: Date): { date: Date; isCurrentMonth: boolean }[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return days.map((d) => ({
    date: d,
    isCurrentMonth: isSameMonth(d, monthStart),
  }));
}

export {
  isSameDay,
  isSameMonth,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  parseISO,
};

