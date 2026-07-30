import { banglaMonthStart, isoDate } from "./banglaCalendar";

export type FestivalCategory = "national" | "muslim" | "hindu" | "cultural";

export interface Festival {
  date: string; // ISO yyyy-mm-dd (Gregorian)
  name: string;
  category: FestivalCategory;
}

/** Festivals whose Gregorian date is derived directly from the Bangla civil calendar. */
function fixedFestivalsForBanglaYear(banglaYear: number): Festival[] {
  const boishakh1 = banglaMonthStart(banglaYear, 0).start;
  const falgun1 = banglaMonthStart(banglaYear, 10).start;
  return [
    { date: isoDate(boishakh1), name: "পহেলা বৈশাখ (বাংলা নববর্ষ)", category: "cultural" },
    { date: isoDate(falgun1), name: "পহেলা ফাল্গুন / বসন্ত উৎসব", category: "cultural" },
  ];
}

/** National observances pinned to a fixed Gregorian date every year. */
function fixedFestivalsForGregYear(y: number): Festival[] {
  return [
    { date: `${y}-02-21`, name: "শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস", category: "national" },
    { date: `${y}-03-26`, name: "স্বাধীনতা দিবস", category: "national" },
    { date: `${y}-05-01`, name: "মহান মে দিবস", category: "national" },
    { date: `${y}-08-15`, name: "জাতীয় শোক দিবস", category: "national" },
    { date: `${y}-12-16`, name: "বিজয় দিবস", category: "national" },
  ];
}

/**
 * Movable lunar / lunisolar festivals. These cannot be derived arithmetically
 * (Eid depends on moon sighting; Hindu pujas follow a lunisolar panchika), so
 * they are pre-loaded per Gregorian year for a limited, verified range.
 * 2026 dates are marked approximate; years outside this table intentionally
 * show nothing rather than a guess.
 */
export const MOVABLE: Record<number, Festival[]> = {
  2024: [
    { date: "2024-02-14", name: "সরস্বতী পূজা", category: "hindu" },
    { date: "2024-04-11", name: "ঈদ-উল-ফিতর", category: "muslim" },
    { date: "2024-06-17", name: "ঈদ-উল-আযহা", category: "muslim" },
    { date: "2024-10-12", name: "দুর্গাপূজা (বিজয়া দশমী)", category: "hindu" },
    { date: "2024-10-31", name: "কালীপূজা", category: "hindu" },
  ],
  2025: [
    { date: "2025-02-02", name: "সরস্বতী পূজা", category: "hindu" },
    { date: "2025-03-31", name: "ঈদ-উল-ফিতর", category: "muslim" },
    { date: "2025-06-07", name: "ঈদ-উল-আযহা", category: "muslim" },
    { date: "2025-10-02", name: "দুর্গাপূজা (বিজয়া দশমী)", category: "hindu" },
    { date: "2025-10-20", name: "কালীপূজা", category: "hindu" },
  ],
  2026: [
    { date: "2026-01-23", name: "সরস্বতী পূজা (আনুমানিক)", category: "hindu" },
    { date: "2026-03-20", name: "ঈদ-উল-ফিতর (আনুমানিক)", category: "muslim" },
    { date: "2026-05-27", name: "ঈদ-উল-আযহা (আনুমানিক)", category: "muslim" },
    { date: "2026-10-20", name: "দুর্গাপূজা — বিজয়া দশমী (আনুমানিক)", category: "hindu" },
    { date: "2026-11-08", name: "কালীপূজা (আনুমানিক)", category: "hindu" },
  ],
};

/** Builds a date -> festival[] index covering the Bangla years around `centerBanglaYear`. */
export function buildFestivalIndex(centerBanglaYear: number): Record<string, Festival[]> {
  const index: Record<string, Festival[]> = {};
  const addFest = (f: Festival) => {
    if (!index[f.date]) index[f.date] = [];
    if (!index[f.date].some((x) => x.name === f.name)) index[f.date].push(f);
  };

  const banglaYears = [centerBanglaYear - 1, centerBanglaYear, centerBanglaYear + 1];
  banglaYears.forEach((by) => fixedFestivalsForBanglaYear(by).forEach(addFest));

  const gregYears = Array.from(
    new Set(banglaYears.flatMap((by) => [by + 593, by + 594])),
  );
  gregYears.forEach((gy) => {
    fixedFestivalsForGregYear(gy).forEach(addFest);
    (MOVABLE[gy] || []).forEach(addFest);
  });

  return index;
}
