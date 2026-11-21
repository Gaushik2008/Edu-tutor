"""Difficulty-aware Bayesian Knowledge Tracing (BKT).

Mastery p(L) is a probability in [0, 1]; the API exposes it as 0-100.

Per answer we:
  1. Adjust guess/slip by question difficulty (harder -> lower guess, lower slip).
  2. Weight the evidence by reasoning quality (0..1). A right answer with poor
     reasoning is weak evidence; a wrong answer with sound reasoning (e.g. a
     slip in arithmetic) is weak negative evidence.
  3. Bayesian posterior update, then apply the learning transition.
  4. Track confidence as a function of the number of observations.
  5. Apply time decay (forgetting) when computing *current* mastery.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, replace
from datetime import datetime

P_INIT = 0.30
P_LEARN = 0.15
P_GUESS = 0.20
P_SLIP = 0.10
MASTERED = 0.80
DEVELOPING = 0.50


@dataclass(frozen=True)
class MasteryState:
    p_mastery: float = P_INIT
    attempts: int = 0
    correct: int = 0
    confidence: float = 0.0


def difficulty_adjusted(difficulty: int) -> tuple[float, float]:
    """Return (guess, slip) for difficulty 1..5."""
    d = max(1, min(5, difficulty))
    guess = P_GUESS * (1.25 - 0.125 * (d - 1))   # 0.25 .. 0.125
    slip = P_SLIP * (1.4 - 0.2 * (d - 1))        # 0.14 .. 0.06
    return guess, slip


def update(
    state: MasteryState,
    correct: bool,
    difficulty: int = 2,
    reasoning_quality: float = 1.0,
) -> MasteryState:
    """Return the new state after one evaluated answer (pure function)."""
    guess, slip = difficulty_adjusted(difficulty)
    p = min(max(state.p_mastery, 0.001), 0.999)

    if correct:
        num = p * (1 - slip)
        den = num + (1 - p) * guess
    else:
        num = p * slip
        den = num + (1 - p) * (1 - guess)
    posterior = num / den

    # Shrink the update toward the prior when the reasoning evidence is weak.
    w = max(0.0, min(1.0, reasoning_quality))
    if not correct:
        w = max(w, 0.35)  # a wrong answer is never ignored entirely
    weighted = p + w * (posterior - p)

    new_p = weighted + (1 - weighted) * P_LEARN
    attempts = state.attempts + 1
    return MasteryState(
        p_mastery=min(max(new_p, 0.0), 1.0),
        attempts=attempts,
        correct=state.correct + (1 if correct else 0),
        confidence=1 - math.exp(-attempts / 3.0),
    )


def decayed(p_mastery: float, last_practiced: datetime | None, now: datetime,
            half_life_days: float = 30.0) -> float:
    """Forgetting: pull mastery toward the prior with an exponential half-life."""
    if last_practiced is None:
        return p_mastery
    days = max(0.0, (now - last_practiced).total_seconds() / 86400)
    f = 0.5 ** (days / half_life_days)
    return P_INIT + (p_mastery - P_INIT) * f


def band(p_mastery: float, attempts: int) -> str:
    if attempts == 0:
        return "not_assessed"
    if p_mastery >= MASTERED:
        return "mastered"
    if p_mastery >= DEVELOPING:
        return "developing"
    return "weak"
