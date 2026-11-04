import { parseISO, addDays, isBefore, isAfter, isSameDay } from 'date-fns';
import { formatIsoDateOnly } from './dateUtils';

export interface RecurrenceConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  daysOfMonth?: number[]; // 1..31
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  maxInstances?: number;
}

/**
 * Generates an array of ISO date strings ('YYYY-MM-DD') for a recurring schedule.
 */
export function generateRecurrenceDates(config: RecurrenceConfig): string[] {
  const {
    frequency,
    daysOfWeek = [],
    daysOfMonth = [],
    startDate,
    endDate,
    maxInstances = 365,
  } = config;

  if (!startDate || !endDate) return [];

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (isAfter(start, end)) {
    return [];
  }

  const effectiveDaysOfWeek =
    daysOfWeek.length > 0 ? daysOfWeek : [start.getDay()];

  const effectiveDaysOfMonth =
    daysOfMonth.length > 0 ? daysOfMonth : [start.getDate()];

  const dates: string[] = [];
  let current = start;
  let safetyCounter = 0;
  const MAX_LOOP = 1000;

  while ((isBefore(current, end) || isSameDay(current, end)) && safetyCounter < MAX_LOOP) {
    safetyCounter++;

    let matches = false;

    if (frequency === 'daily') {
      matches = true;
    } else if (frequency === 'weekly') {
      const dayOfWeek = current.getDay();
      matches = effectiveDaysOfWeek.includes(dayOfWeek);
    } else if (frequency === 'monthly') {
      const dayOfMonth = current.getDate();
      matches = effectiveDaysOfMonth.includes(dayOfMonth);
    }

    if (matches) {
      dates.push(formatIsoDateOnly(current));
      if (dates.length >= maxInstances) {
        break;
      }
    }

    current = addDays(current, 1);
  }

  return dates;
}

