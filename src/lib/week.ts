/**
 * Timezone-aware "this week" (Monday 00:00:00 → Sunday 23:59:59.999) windowing.
 *
 * Vercel cron fires at a fixed UTC time, but the household thinks in local time
 * ("end of the week, Sunday night"). These helpers compute the Mon–Sun window
 * that *contains* a given instant in a given IANA timezone, returning the window
 * boundaries as absolute UTC `Date`s suitable for a Prisma `date` range query.
 */

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const DAY_MS = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** The wall-clock parts of `date` as seen in `timeZone`. */
function partsInZone(timeZone: string, date: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) map[p.type] = p.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: WEEKDAY_INDEX[map.weekday] ?? 0,
  };
}

/** Offset of `timeZone` from UTC at `date`, in milliseconds (local = utc + offset). */
function offsetMs(timeZone: string, date: Date): number {
  const p = partsInZone(timeZone, date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}

/** The UTC instant for a given wall-clock time in `timeZone`. */
function zonedWallTimeToUtc(
  timeZone: string,
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  s: number,
  ms = 0,
): Date {
  // Resolve the offset at second precision (partsInZone drops milliseconds),
  // then re-apply the millisecond component so it isn't folded into the offset.
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  const offset = offsetMs(timeZone, new Date(guess));
  return new Date(guess - offset + ms);
}

export type WeekWindow = {
  /** Monday 00:00:00.000 local, as a UTC instant. */
  start: Date;
  /** Sunday 23:59:59.999 local, as a UTC instant. */
  end: Date;
  /** Monday's local date, YYYY-MM-DD. */
  startYmd: string;
  /** Sunday's local date, YYYY-MM-DD. */
  endYmd: string;
};

/**
 * The Monday–Sunday week (in `timeZone`) that contains `now`.
 * Date-only arithmetic is done in UTC to sidestep DST hour shifts; only the
 * final boundary conversions go through the timezone offset.
 */
export function weekWindowFor(now: Date, timeZone: string): WeekWindow {
  const p = partsInZone(timeZone, now);
  const base = Date.UTC(p.year, p.month - 1, p.day);
  const daysSinceMonday = (p.weekday + 6) % 7; // Mon -> 0, Sun -> 6
  const monday = new Date(base - daysSinceMonday * DAY_MS);
  const sunday = new Date(monday.getTime() + 6 * DAY_MS);

  const my = monday.getUTCFullYear();
  const mmo = monday.getUTCMonth() + 1;
  const md = monday.getUTCDate();
  const sy = sunday.getUTCFullYear();
  const smo = sunday.getUTCMonth() + 1;
  const sd = sunday.getUTCDate();

  return {
    start: zonedWallTimeToUtc(timeZone, my, mmo, md, 0, 0, 0, 0),
    end: zonedWallTimeToUtc(timeZone, sy, smo, sd, 23, 59, 59, 999),
    startYmd: `${my}-${pad(mmo)}-${pad(md)}`,
    endYmd: `${sy}-${pad(smo)}-${pad(sd)}`,
  };
}

/** Configured household timezone; defaults to US Eastern. */
export function appTimeZone(): string {
  return process.env.APP_TIMEZONE || "America/New_York";
}
