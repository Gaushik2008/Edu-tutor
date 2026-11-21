"""Adaptive difficulty and next-concept selection (deterministic)."""
from __future__ import annotations

from collections.abc import Sequence


def target_difficulty(p_mastery: float, recent: Sequence[bool]) -> int:
    """Pick difficulty 1..5 from mastery and the last few outcomes."""
    base = 1 + int(p_mastery * 4.999)           # 0..1 -> 1..5
    last3 = list(recent)[-3:]
    if len(last3) >= 2 and not any(last3[-2:]):
        base -= 1                                # repeated mistakes: simplify
    if len(last3) == 3 and all(last3):
        base += 1                                # consistent success: step up
    return max(1, min(5, base))


def next_concept(mastery: dict[str, float], attempts: dict[str, int],
                 prereqs: dict[str, list[str]], threshold: float = 0.5) -> str | None:
    """Weakest concept whose prerequisites are sufficiently understood.
    Unassessed concepts count as 0.3 so diagnostics come first."""
    def m(c: str) -> float:
        return mastery.get(c, 0.3) if attempts.get(c, 0) else 0.3

    candidates = [c for c in prereqs
                  if all(m(p) >= threshold for p in prereqs[c])]
    if not candidates:  # cycle/very weak foundations: fall back to roots
        candidates = [c for c, ps in prereqs.items() if not ps]
    candidates = [c for c in candidates if m(c) < 0.8] or candidates
    return min(candidates, key=lambda c: (m(c), c)) if candidates else None
