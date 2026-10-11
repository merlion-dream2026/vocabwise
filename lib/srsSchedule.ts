// Shared calendar + sizing rules for the Daily SRS (vocab_sync.srs). Every "today" / due date is a
// Vietnam-time (UTC+7) calendar day, so the client, the SRS page and the push cron agree on what is
// due — UTC dates used to flip a day early/late between 0h and 7h VN.

/** YYYY-MM-DD in Vietnam time, `days` from now. */
export function vnDate(days = 0): string {
  return new Date(Date.now() + 7 * 3600_000 + days * 86_400_000).toISOString().slice(0, 10)
}

/** Words per SRS session, for every plan. A Pro child can start another round right after. */
export const SRS_SESSION_SIZE = 20

/** A word met for the first time is first reviewed the next day, not the same day. */
export const FIRST_REVIEW_AFTER_DAYS = 1
