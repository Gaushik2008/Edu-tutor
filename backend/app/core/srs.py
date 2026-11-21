"""SM-2 inspired revision scheduler with mastery/misconception awareness."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

BASE_INTERVALS = [1, 3, 7, 14, 30]  # days, adapted below


@dataclass(frozen=True)
class ReviewState:
    repetitions: int = 0
    ease: float = 2.3
    interval_days: float = 0.0


def schedule(state: ReviewState, quality: float, now: datetime,
             difficulty: int = 2, misconception_open: bool = False
             ) -> tuple[ReviewState, datetime]:
    """quality in [0,1] (accuracy blended with reasoning). Returns (state, due)."""
    q = max(0.0, min(1.0, quality))
    ease = max(1.3, state.ease + (0.1 - (1 - q) * (0.8 + (1 - q) * 0.4)))

    if q < 0.6:  # failed review: restart ladder, see it again tomorrow
        new = ReviewState(0, ease, 1.0)
        return new, now + timedelta(days=1)

    reps = state.repetitions + 1
    base = BASE_INTERVALS[min(reps - 1, len(BASE_INTERVALS) - 1)]
    interval = base * (ease / 2.3)
    if reps > len(BASE_INTERVALS):
        interval = state.interval_days * ease
    interval *= 1.0 - 0.05 * (difficulty - 3)   # harder concepts revisit sooner
    if misconception_open:
        interval = min(interval, 3.0)
    interval = max(1.0, round(interval, 1))
    return ReviewState(reps, ease, interval), now + timedelta(days=interval)


def is_due(due: datetime, now: datetime) -> str:
    if due <= now - timedelta(days=1):
        return "overdue"
    return "due" if due <= now else "upcoming"
