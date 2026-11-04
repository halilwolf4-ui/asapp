import { describe, it, expect } from 'vitest';
import { generateRecurrenceDates } from './recurrenceUtils';

describe('recurrenceUtils', () => {
  it('generates daily dates correctly', () => {
    const dates = generateRecurrenceDates({
      frequency: 'daily',
      startDate: '2026-11-01',
      endDate: '2026-11-05',
    });
    expect(dates).toEqual([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
    ]);
  });

  it('generates weekly dates for specific days of week', () => {
    // 2026-11-02 is Monday (1), 2026-11-04 is Wednesday (3)
    const dates = generateRecurrenceDates({
      frequency: 'weekly',
      daysOfWeek: [1, 3], // Mon, Wed
      startDate: '2026-11-02',
      endDate: '2026-11-15',
    });
    expect(dates).toEqual([
      '2026-11-02', // Mon
      '2026-11-04', // Wed
      '2026-11-09', // Mon
      '2026-11-11', // Wed
    ]);
  });

  it('generates monthly dates on selected days of month', () => {
    const dates = generateRecurrenceDates({
      frequency: 'monthly',
      daysOfMonth: [1, 15],
      startDate: '2026-11-01',
      endDate: '2026-12-31',
    });
    expect(dates).toEqual([
      '2026-11-01',
      '2026-11-15',
      '2026-12-01',
      '2026-12-15',
    ]);
  });

  it('returns empty array if start date is after end date', () => {
    const dates = generateRecurrenceDates({
      frequency: 'daily',
      startDate: '2026-11-10',
      endDate: '2026-11-05',
    });
    expect(dates).toEqual([]);
  });
});

