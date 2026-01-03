import { useCallback, useMemo } from 'react';

const LOCALE = 'en-CA';

function parseYyyyMmDd(dateStr: string): {
  year: number;
  month: number;
  day: number;
} {
  // Strict: YYYY-MM-DD
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    throw new Error(
      `Invalid date format: "${dateStr}". Expected "YYYY-MM-DD".`,
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Basic range checks
  if (month < 1 || month > 12)
    throw new Error(`Invalid month in "${dateStr}".`);
  if (day < 1 || day > 31) throw new Error(`Invalid day in "${dateStr}".`);

  return { year, month, day };
}

export interface DateFormatter {
  /**
   * Formats a "YYYY-MM-DD" date string to "Month YYYY" format using an absolute UTC date.
   *
   * NOTE: This function ignores timezones, if a future need for supporting days or specific hours
   * arises, this function should be updated or deprecated.
   * @param dateStr - The date string in "YYYY-MM-DD" format.
   * @returns The formatted date string in "Month YYYY" format.
   */
  formatMonthYear: (dateStr: string) => string;
}

export function useDateFormatter(): DateFormatter {
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(LOCALE, {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    [LOCALE],
  );

  const formatMonthYear = useCallback(
    (dateStr: string) => {
      const { year, month, day } = parseYyyyMmDd(dateStr);

      const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

      return formatter.format(utcDate);
    },
    [formatter],
  );

  return { formatMonthYear };
}
