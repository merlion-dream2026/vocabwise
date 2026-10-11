// Sizing rules for the Daily SRS (vocab_sync.srs). Due dates are Vietnam-time calendar days (lib/vnDate.ts).

/** Words per SRS session, for every plan. A Pro child can start another round right after. */
export const SRS_SESSION_SIZE = 20

/** A word met for the first time is first reviewed the next day, not the same day. */
export const FIRST_REVIEW_AFTER_DAYS = 1
