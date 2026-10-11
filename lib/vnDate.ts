// The app's calendar day is the Vietnam (UTC+7) day — for SRS due dates, streaks and the daily
// history buckets alike, so the client, the dashboards and the crons agree on "today". (UTC days
// used to roll over at 7h VN: a child studying at 6h was still on "yesterday".)

/** YYYY-MM-DD in Vietnam time, `days` from now (negative = past). */
export function vnDate(days = 0): string {
  return new Date(Date.now() + 7 * 3600_000 + days * 86_400_000).toISOString().slice(0, 10)
}
