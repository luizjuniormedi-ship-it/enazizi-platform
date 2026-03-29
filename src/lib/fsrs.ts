/**
 * FSRS v5 — Free Spaced Repetition Scheduler
 * Pure-function implementation for ENAZIZI.
 *
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

// ── Types ──────────────────────────────────────────────────────

export enum State {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

export interface Card {
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: State;
  due: Date;
  last_review: Date | null;
}

export interface ReviewLog {
  rating: Rating;
  scheduled_days: number;
  elapsed_days: number;
  reviewed_at: Date;
}

export interface SchedulingResult {
  card: Card;
  log: ReviewLog;
}

// ── Default parameters (FSRS-5 optimised defaults) ─────────────

const DEFAULT_W = [
  0.4072, 1.1829, 3.1262, 15.4722,
  7.2102, 0.5316, 1.0651, 0.0589,
  1.5330, 0.1418, 1.0100,
  1.9395, 0.1100, 0.2900,
  2.2273, 0.2090, 2.9898,
  0.5100, 0.6600,
];

// ── Core functions ─────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

/** Retrievability — probability of recall after `t` days with stability `s`. */
export function retrievability(elapsed: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsed / (9 * stability), -1);
}

/** Initial stability after first review. */
function initStability(rating: Rating, w: number[]): number {
  return Math.max(w[rating - 1], 0.1);
}

/** Initial difficulty after first review. */
function initDifficulty(rating: Rating, w: number[]): number {
  return clamp(w[4] - Math.exp(w[5] * (rating - 1)) + 1, 1, 10);
}

/** Mean reversion for difficulty. */
function meanReversion(init: number, current: number): number {
  return w[7] * init + (1 - w[7]) * current;
}

let w = DEFAULT_W;

/** Next difficulty after a review. */
function nextDifficulty(d: number, rating: Rating): number {
  const deltaDifficulty = -w[6] * (rating - 3);
  const nextD = d + deltaDifficulty;
  return clamp(meanReversion(w[4], nextD), 1, 10);
}

/** Short-term stability (Learning/Relearning states). */
function shortTermStability(s: number, rating: Rating): number {
  return s * Math.exp(w[17] * (rating - 3 + w[18]));
}

/** Next stability after successful recall. */
function nextRecallStability(d: number, s: number, r: number, rating: Rating): number {
  const hardPenalty = rating === Rating.Hard ? w[15] : 1;
  const easyBonus = rating === Rating.Easy ? w[16] : 1;
  return s * (
    1 +
    Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp((1 - r) * w[10]) - 1) *
    hardPenalty *
    easyBonus
  );
}

/** Next stability after a lapse (Again). */
function nextForgetStability(d: number, s: number, r: number): number {
  return Math.max(
    w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]),
    0.1
  );
}

/** Interval from stability (target retrievability = 90%). */
export function nextInterval(stability: number, requestRetention = 0.9): number {
  return Math.max(Math.round(9 * stability * (1 / requestRetention - 1)), 1);
}

// ── Scheduling ─────────────────────────────────────────────────

export function createNewCard(): Card {
  return {
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: State.New,
    due: new Date(),
    last_review: null,
  };
}

export function reviewCard(card: Card, rating: Rating, now = new Date(), params = DEFAULT_W): SchedulingResult {
  w = params;

  const elapsed = card.last_review
    ? (now.getTime() - card.last_review.getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  const next: Card = { ...card };
  next.elapsed_days = elapsed;
  next.reps += 1;
  next.last_review = now;

  const r = card.state === State.Review
    ? retrievability(elapsed, card.stability)
    : 0;

  switch (card.state) {
    case State.New: {
      next.stability = initStability(rating, w);
      next.difficulty = initDifficulty(rating, w);

      if (rating === Rating.Again) {
        next.state = State.Learning;
        next.scheduled_days = 0;
        next.due = now;
      } else if (rating === Rating.Hard) {
        next.state = State.Learning;
        next.scheduled_days = 0;
        next.due = now;
      } else if (rating === Rating.Good) {
        next.state = State.Learning;
        const interval = nextInterval(next.stability);
        next.scheduled_days = interval;
        next.due = addDays(now, interval);
      } else {
        // Easy
        next.state = State.Review;
        const interval = nextInterval(next.stability);
        next.scheduled_days = interval;
        next.due = addDays(now, interval);
      }
      break;
    }

    case State.Learning:
    case State.Relearning: {
      next.difficulty = nextDifficulty(card.difficulty, rating);

      if (rating === Rating.Again) {
        next.stability = shortTermStability(card.stability, rating);
        next.state = card.state; // stay
        next.scheduled_days = 0;
        next.due = now;
        if (card.state === State.Learning) next.lapses += 1;
      } else if (rating === Rating.Hard) {
        next.stability = shortTermStability(card.stability, rating);
        next.state = card.state;
        next.scheduled_days = 0;
        next.due = now;
      } else {
        // Good or Easy — graduate to Review
        next.stability = shortTermStability(card.stability, rating);
        next.state = State.Review;
        const interval = nextInterval(next.stability);
        next.scheduled_days = interval;
        next.due = addDays(now, interval);
      }
      break;
    }

    case State.Review: {
      next.difficulty = nextDifficulty(card.difficulty, rating);

      if (rating === Rating.Again) {
        next.lapses += 1;
        next.stability = nextForgetStability(card.difficulty, card.stability, r);
        next.state = State.Relearning;
        next.scheduled_days = 0;
        next.due = now;
      } else {
        next.stability = nextRecallStability(card.difficulty, card.stability, r, rating);
        next.state = State.Review;
        const interval = nextInterval(next.stability);
        next.scheduled_days = interval;
        next.due = addDays(now, interval);
      }
      break;
    }
  }

  const log: ReviewLog = {
    rating,
    scheduled_days: next.scheduled_days,
    elapsed_days: elapsed,
    reviewed_at: now,
  };

  return { card: next, log };
}

// ── Helpers ────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Convert a DB row into an FSRS Card object. */
export function cardFromRow(row: any): Card {
  return {
    stability: row.stability ?? 0,
    difficulty: row.difficulty ?? 0,
    elapsed_days: row.elapsed_days ?? 0,
    scheduled_days: row.scheduled_days ?? 0,
    reps: row.reps ?? 0,
    lapses: row.lapses ?? 0,
    state: row.state ?? State.New,
    due: new Date(row.due),
    last_review: row.last_review ? new Date(row.last_review) : null,
  };
}

/** Convert an FSRS Card to DB-ready fields. */
export function cardToRow(card: Card) {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    due: card.due.toISOString(),
    last_review: card.last_review?.toISOString() ?? null,
  };
}
