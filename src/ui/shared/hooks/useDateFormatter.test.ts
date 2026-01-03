import { renderHook } from '@testing-library/react';
import { useDateFormatter } from './useDateFormatter';

describe('useDateFormatter', () => {
  it('formats a valid YYYY-MM-DD string into "Mon YYYY"', () => {
    const { result } = renderHook(() => useDateFormatter());

    expect(result.current.formatMonthYear('2023-07-15')).toBe('Jul 2023');
    expect(result.current.formatMonthYear('1999-12-01')).toBe('Dec 1999');
  });

  it('correctly formats leap-year dates', () => {
    const { result } = renderHook(() => useDateFormatter());

    expect(result.current.formatMonthYear('2020-02-29')).toBe('Feb 2020');
  });

  it('returns a stable formatMonthYear reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useDateFormatter());

    const initialFormatter = result.current.formatMonthYear;
    rerender();
    expect(result.current.formatMonthYear).toBe(initialFormatter);
  });

  it('throws when the date string is not in YYYY-MM-DD format', () => {
    const { result } = renderHook(() => useDateFormatter());

    expect(() => result.current.formatMonthYear('07-15-2023')).toThrow(
      'Invalid date format: "07-15-2023". Expected "YYYY-MM-DD".',
    );
  });

  it('throws when the month is out of range', () => {
    const { result } = renderHook(() => useDateFormatter());

    expect(() => result.current.formatMonthYear('2023-13-10')).toThrow(
      'Invalid month in "2023-13-10".',
    );
    expect(() => result.current.formatMonthYear('2023-00-10')).toThrow(
      'Invalid month in "2023-00-10".',
    );
  });

  it('throws when the day is out of range', () => {
    const { result } = renderHook(() => useDateFormatter());

    expect(() => result.current.formatMonthYear('2023-05-00')).toThrow(
      'Invalid day in "2023-05-00".',
    );
    expect(() => result.current.formatMonthYear('2023-05-32')).toThrow(
      'Invalid day in "2023-05-32".',
    );
  });
});
