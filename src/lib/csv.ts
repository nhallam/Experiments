export function csvField(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Format integer cents as a plain decimal string, e.g. 1234 -> "12.34". */
export function dollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Local-ish YYYY-MM-DD from a Date's own fields. */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Join a matrix of cells into a CRLF-terminated CSV string. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(csvField).join(",")).join("\r\n") + "\r\n";
}
