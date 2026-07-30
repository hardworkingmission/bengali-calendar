import {
  addDays,
  banglaMonthStart,
  GREG_MONTH_EN,
  isoDate,
  toBn,
  WEEKDAYS_BN,
} from "@/lib/banglaCalendar";
import type { Festival } from "@/lib/festivals";
import { CategoryDot } from "./CategoryDot";

interface MonthGridProps {
  banglaYear: number;
  banglaMonth: number;
  todayIso: string;
  festivalsByDate: Record<string, Festival[]>;
  notes: Record<string, string>;
  onSelectDate: (iso: string, y: number, m: number, d: number) => void;
}

export function MonthGrid({
  banglaYear,
  banglaMonth,
  todayIso,
  festivalsByDate,
  notes,
  onSelectDate,
}: MonthGridProps) {
  const info = banglaMonthStart(banglaYear, banglaMonth);
  const leadEmpty = info.start.getDay();
  const cells = Array.from({ length: info.daysInMonth }, (_, d) => {
    const gdate = addDays(info.start, d);
    return { day: d + 1, gdate, iso: isoDate(gdate) };
  });

  return (
    <div>
      <div className="weekhead">
        {WEEKDAYS_BN.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="monthgrid">
        {Array.from({ length: leadEmpty }, (_, i) => (
          <div className="daycell empty" key={`lead-${i}`} />
        ))}
        {cells.map(({ day, gdate, iso }) => {
          const isToday = iso === todayIso;
          const isWeekend = gdate.getDay() === 0 || gdate.getDay() === 6;
          const fests = festivalsByDate[iso] || [];
          const hasNote = !!notes[iso];
          return (
            <button
              type="button"
              key={iso}
              className={`daycell${isToday ? " today" : ""}${isWeekend ? " weekend" : ""}`}
              onClick={() => onSelectDate(iso, banglaYear, banglaMonth, day)}
            >
              {hasNote && <span className="note-flag" title="নোট আছে" />}
              <span className="bn-num">{toBn(day)}</span>
              <span className="greg-num">
                {GREG_MONTH_EN[gdate.getMonth()]} {gdate.getDate()}
              </span>
              {fests.length > 0 && (
                <div className="festival-tags">
                  {fests.map((f) => (
                    <CategoryDot key={f.name} category={f.category} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
