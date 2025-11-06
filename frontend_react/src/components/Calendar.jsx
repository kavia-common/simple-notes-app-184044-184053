import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Utilities for date handling kept minimal to avoid heavy deps.
 */

/**
 * Normalize a Date (or ISO string) to a yyyy-mm-dd key in local time.
 * This makes it safe to compare only the calendar day regardless of time.
 */
function toDayKey(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Build calendar grid for target month.
 * Returns a flat array of day objects covering complete weeks to fit a 7xN grid.
 */
function buildMonthGrid(anchorDate) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth(); // 0-based
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0 Sun - 6 Sat
  // Start from the Sunday (or locale week start) before/at firstOfMonth
  const startDate = new Date(year, month, 1 - startDay);

  const days = [];
  // Up to 6 weeks view (6 * 7 = 42 days)
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push({
      date: d,
      key: toDayKey(d),
      isCurrentMonth: d.getMonth() === month,
      isToday: toDayKey(d) === toDayKey(new Date()),
    });
  }
  return days;
}

/**
 * Get localized weekday short names (Su, Mo, ...)
 */
function getWeekdayLabels() {
  const base = new Date(2024, 0, 7); // Sunday
  return [...Array(7)].map((_, i) =>
    new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i))
  );
}

// PUBLIC_INTERFACE
export default function Calendar({
  selectedDate,
  onChange,
  labelledById,
  ariaLabel = 'Calendar',
}) {
  /**
   * Accessible, keyboard-navigable month view calendar with a glassmorphism look.
   * - selectedDate: Date | string (ISO) | null
   * - onChange: (Date | null) => void
   */
  const [viewDate, setViewDate] = useState(() => {
    const sd = selectedDate ? new Date(selectedDate) : new Date();
    return Number.isNaN(sd.getTime()) ? new Date() : sd;
  });

  useEffect(() => {
    if (!selectedDate) return;
    const sd = new Date(selectedDate);
    if (!Number.isNaN(sd.getTime())) {
      setViewDate(sd);
    }
  }, [selectedDate]);

  const weeks = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const weekLabels = useMemo(() => getWeekdayLabels(), []);
  const selectedKey = selectedDate ? toDayKey(selectedDate) : '';
  const gridRef = useRef(null);

  const gotoPrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const gotoNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };
  const gotoToday = () => {
    const t = new Date();
    setViewDate(t);
    onChange?.(t);
  };
  const clearSelection = () => {
    onChange?.(null);
  };

  const handleKeyDown = (e, day) => {
    // Arrow navigation within grid
    let handled = true;
    switch (e.key) {
      case 'ArrowLeft':
        moveFocusBy(-1);
        break;
      case 'ArrowRight':
        moveFocusBy(1);
        break;
      case 'ArrowUp':
        moveFocusBy(-7);
        break;
      case 'ArrowDown':
        moveFocusBy(7);
        break;
      case 'Home': {
        // go to start of week
        const idx = getIndexOfDay(day.key);
        if (idx > -1) focusIndex(idx - (idx % 7));
        break;
      }
      case 'End': {
        // go to end of week
        const idx = getIndexOfDay(day.key);
        if (idx > -1) focusIndex(idx + (6 - (idx % 7)));
        break;
      }
      case 'PageUp': {
        setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, d.getDate()));
        break;
      }
      case 'PageDown': {
        setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()));
        break;
      }
      case 'Enter':
      case ' ':
        onChange?.(day.date);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  };

  const getIndexOfDay = (key) => weeks.findIndex((d) => d.key === key);

  const moveFocusBy = (delta) => {
    const container = gridRef.current;
    if (!container) return;
    const focusable = container.querySelectorAll('[role="gridcell"][tabindex]');
    const currentIndex = Array.from(focusable).findIndex((el) => el === document.activeElement);
    const targetIndex = Math.max(0, Math.min(focusable.length - 1, (currentIndex < 0 ? 0 : currentIndex + delta)));
    focusable[targetIndex]?.focus();
  };

  const focusIndex = (index) => {
    const container = gridRef.current;
    if (!container) return;
    const focusable = container.querySelectorAll('[role="gridcell"][tabindex]');
    focusable[index]?.focus();
  };

  const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
  const weekdayLong = new Intl.DateTimeFormat(undefined, { weekday: 'long' });

  return (
    <section
      className="calendar glass sheen-top highlight-corner"
      aria-labelledby={labelledById}
      aria-label={labelledById ? undefined : ariaLabel}
    >
      <div className="calendar-header">
        <button
          type="button"
          className="btn btn-secondary light-sweep"
          onClick={gotoPrevMonth}
          aria-label="Previous month"
          title="Previous month"
        >
          ‹
        </button>
        <h3 className="calendar-title" id={labelledById || undefined}>
          {monthFormatter.format(viewDate)}
        </h3>
        <div className="calendar-header-actions">
          <button
            type="button"
            className="btn btn-ghost light-sweep"
            onClick={gotoToday}
            aria-label="Go to today"
            title="Go to today"
          >
            Today
          </button>
          <button
            type="button"
            className="btn btn-secondary light-sweep"
            onClick={gotoNextMonth}
            aria-label="Next month"
            title="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="calendar-grid" role="grid" aria-readonly="true" ref={gridRef}>
        <div className="calendar-weekdays" role="row">
          {weekLabels.map((w) => (
            <div key={w} className="calendar-weekday" role="columnheader" aria-label={w}>
              {w}
            </div>
          ))}
        </div>
        <div className="calendar-days" role="rowgroup">
          {weeks.map((day, idx) => {
            const isSelected = selectedKey && day.key === selectedKey;
            return (
              <button
                key={day.key}
                type="button"
                role="gridcell"
                className={[
                  'calendar-day light-sweep',
                  day.isCurrentMonth ? 'is-current' : 'is-adjacent',
                  day.isToday ? 'is-today' : '',
                  isSelected ? 'is-selected' : '',
                ].join(' ')}
                aria-selected={isSelected ? 'true' : 'false'}
                aria-label={`${weekdayLong.format(day.date)}, ${day.date.toLocaleDateString()}` + (day.isToday ? ' (Today)' : '')}
                tabIndex={idx === 0 ? 0 : -1}
                onClick={() => onChange?.(day.date)}
                onKeyDown={(e) => handleKeyDown(e, day)}
              >
                <span className="calendar-day-number">{day.date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="calendar-footer">
        <button
          type="button"
          className="btn btn-ghost light-sweep"
          onClick={clearSelection}
          aria-label="Clear date filter"
          title="Clear date filter"
        >
          All notes
        </button>
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
export function isSameDay(a, b) {
  /** Returns true if two date-like values are the same calendar day (local time). */
  if (!a || !b) return false;
  return toDayKey(a) === toDayKey(b);
}

// PUBLIC_INTERFACE
export function toISODate(value) {
  /** Returns yyyy-mm-dd for a date-like value (local time). */
  return toDayKey(value);
}
