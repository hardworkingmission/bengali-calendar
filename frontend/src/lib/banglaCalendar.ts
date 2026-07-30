export const MONTHS_BN = [
  "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন",
  "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র",
] as const;

export const WEEKDAYS_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"] as const;

export const WEEKDAYS_BN_FULL = [
  "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার",
] as const;

export const GREG_MONTH_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toBn(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
}

export function isLeapGreg(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Day-length of each of the 12 Bangla months for the Bangla year that begins
 * on 14 April of `startYear` (Bangladesh 1987/2019-revised civil calendar). */
export function monthLengths(startYear: number): number[] {
  const nextIsLeap = isLeapGreg(startYear + 1);
  return [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, nextIsLeap ? 31 : 30, 30];
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface BanglaMonthInfo {
  start: Date;
  daysInMonth: number;
  lens: number[];
  startYear: number;
}

/** Bangla year N's Poila Boishakh falls in Gregorian year N+593. */
export function banglaMonthStart(banglaYear: number, monthIdx: number): BanglaMonthInfo {
  const startYear = banglaYear + 593;
  const apr14 = new Date(startYear, 3, 14);
  const lens = monthLengths(startYear);
  let offset = 0;
  for (let i = 0; i < monthIdx; i++) offset += lens[i];
  return { start: addDays(apr14, offset), daysInMonth: lens[monthIdx], lens, startYear };
}

export interface BanglaDate {
  year: number;
  month: number;
  day: number;
}

export function gregorianToBangla(date: Date): BanglaDate {
  const y = date.getFullYear();
  const apr14ThisYear = new Date(y, 3, 14);
  const startYear = date >= apr14ThisYear ? y : y - 1;
  const apr14 = new Date(startYear, 3, 14);
  let offset = daysBetween(apr14, date);
  const lens = monthLengths(startYear);
  const banglaYear = startYear - 593;
  let m = 0;
  while (offset >= lens[m]) {
    offset -= lens[m];
    m++;
  }
  return { year: banglaYear, month: m, day: offset + 1 };
}
