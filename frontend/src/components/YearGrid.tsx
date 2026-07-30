import { addDays, banglaMonthStart, isoDate, MONTHS_BN, toBn, WEEKDAYS_BN } from "@/lib/banglaCalendar";
import type { Festival } from "@/lib/festivals";

interface YearGridProps {
  banglaYear: number;
  todayIso: string;
  festivalsByDate: Record<string, Festival[]>;
  onSelectDate: (iso: string, y: number, m: number, d: number) => void;
}

export function YearGrid({ banglaYear, todayIso, festivalsByDate, onSelectDate }: YearGridProps) {
  return (
    <div className="yeargrid">
      {MONTHS_BN.map((name, m) => {
        const info = banglaMonthStart(banglaYear, m);
        const lead = info.start.getDay();
        const cells = Array.from({ length: info.daysInMonth }, (_, d) => {
          const gdate = addDays(info.start, d);
          return { day: d + 1, iso: isoDate(gdate) };
        });
        return (
          <div className="minimonth" key={m}>
            <h3>{name}</h3>
            <div className="minigrid">
              {WEEKDAYS_BN.map((w) => (
                <div className="mh" key={w}>
                  {w.charAt(0)}
                </div>
              ))}
              {Array.from({ length: lead }, (_, i) => (
                <div className="minicell empty" key={`lead-${i}`} />
              ))}
              {cells.map(({ day, iso }) => {
                const fests = festivalsByDate[iso] || [];
                const isToday = iso === todayIso;
                const style = fests.length
                  ? ({ "--fc": `var(--cat-${fests[0].category})` } as React.CSSProperties)
                  : undefined;
                return (
                  <div
                    key={iso}
                    className={`minicell${isToday ? " today" : ""}${fests.length ? " fest" : ""}`}
                    style={style}
                    title={`${name} ${toBn(day)}`}
                    onClick={() => onSelectDate(iso, banglaYear, m, day)}
                  >
                    {toBn(day)}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
