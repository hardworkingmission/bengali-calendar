import { GREG_MONTH_EN, MONTHS_BN, toBn, WEEKDAYS_BN_FULL } from "@/lib/banglaCalendar";
import type { BanglaDate } from "@/lib/banglaCalendar";
import type { Festival } from "@/lib/festivals";
import { CategoryDot } from "./CategoryDot";

interface SidebarProps {
  today: Date;
  todayBangla: BanglaDate;
  todayFestivals: Festival[];
  notes: Record<string, string>;
  signedIn: boolean;
}

export function Sidebar({ today, todayBangla, todayFestivals, notes, signedIn }: SidebarProps) {
  const noteEntries = Object.entries(notes)
    .filter(([, text]) => !!text)
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="side-stack no-print">
      <div className="card today-card">
        <h2>আজকের পঞ্জিকা</h2>
        <p className="today-bn">
          {toBn(todayBangla.day)} {MONTHS_BN[todayBangla.month]} {toBn(todayBangla.year)}
        </p>
        <p className="today-sub">
          {WEEKDAYS_BN_FULL[today.getDay()]} · {GREG_MONTH_EN[today.getMonth()]} {today.getDate()},{" "}
          {today.getFullYear()}
        </p>
        <div className="today-fest">
          {todayFestivals.length ? (
            todayFestivals.map((f) => (
              <span className="fest-chip" key={f.name}>
                <CategoryDot category={f.category} />
                {f.name}
              </span>
            ))
          ) : (
            <span className="empty-hint">আজ কোনো উৎসব নেই</span>
          )}
        </div>
      </div>

      <div className="card notes-card">
        <h2>ব্যক্তিগত নোট</h2>
        <p className="empty-hint" style={{ marginTop: "-6px", marginBottom: "8px" }}>
          {signedIn ? "সব ডিভাইসে সিঙ্ক করা হচ্ছে" : "শুধু এই ব্রাউজারে সংরক্ষিত — সিঙ্ক করতে লগইন করুন"}
        </p>
        {noteEntries.length ? (
          <div>
            {noteEntries.map(([dateKey, text]) => {
              const [y, m, d] = dateKey.split("-");
              const label = `${GREG_MONTH_EN[+m - 1]} ${+d}, ${y}`;
              return (
                <div className="note-item" key={dateKey}>
                  <div className="nd">{label}</div>
                  {text}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-hint">কোনো নোট নেই। তারিখে ক্লিক করে যোগ করুন।</p>
        )}
      </div>

      <div className="card disclaimer">
        চন্দ্র নির্ভর উৎসব (ঈদ, দুর্গাপূজা, কালীপূজা, সরস্বতী পূজা)-এর তারিখ ২০২৪–২০২৬ সালের জন্য আনুমানিক দেওয়া
        আছে; চাঁদ দেখা ও পঞ্জিকা অনুযায়ী প্রকৃত তারিখ ভিন্ন হতে পারে। সঠিক তারিখের জন্য স্থানীয় ঘোষণা যাচাই করুন।
      </div>
    </div>
  );
}
