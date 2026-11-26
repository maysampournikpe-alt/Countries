const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day key, e.g. 2026-11-26. Streaks and daily goals follow the learner's own time zone. */
export function dayKey(t: number | Date = Date.now()): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole calendar days between two day keys (b − a). */
export function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

export function lastNDays(n: number, now = Date.now()): string[] {
  const out: string[] = [];
  const d = new Date(now);
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i)));
  return out;
}

export function shuffle<T>(arr: T[], rnd = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
