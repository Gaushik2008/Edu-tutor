"""Rule-based reasoning analyser (fallback when no LLM key is configured).

Outputs a *prediction with confidence*, never a certainty. Teachers can review
low-confidence cases. An LLM-backed analyser must return the same schema and is
validated by `validate_analysis` before use.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

CATEGORIES = {
    "calculation_error", "wrong_formula", "conceptual_misunderstanding",
    "incomplete_reasoning", "right_answer_wrong_reasoning", "insufficient_evidence",
    "none",
}


@dataclass
class Analysis:
    category: str
    misconception: str | None = None
    confidence: float = 0.5
    severity: str = "low"
    reasoning_quality: float = 0.5
    intervention: str | None = None
    tags: list[str] = field(default_factory=list)


# (tag, concept_id, regex on reasoning, label, intervention)
RULES = [
    ("R_UP_I_UP", "ohms_law",
     r"(resistance|r)\b.*\b(increase|higher|more)\b.*\bcurrent\b.*\b(increase|higher|more|rise)|"
     r"current\b.*\b(increase|rise)s?\b.*(because|as)\b.*resist",
     "Believes current rises when resistance rises",
     "Use I = V/R with V = 10 V: R = 2 Ω gives 5 A, R = 5 Ω gives 2 A."),
    ("CURRENT_USED_UP", "electric_current",
     r"current\b.*\b(used up|consumed|gets less|reduces after|lost)\b|used up by the (bulb|resistor)",
     "Thinks current is used up as it passes through a component",
     "Show ammeters before and after a bulb reading equal; energy, not charge, is transferred."),
    ("PARALLEL_ADDS", "parallel_combination",
     r"parallel\b.*\b(add|sum)\b.*resist|resistances? (are )?added in parallel",
     "Adds resistances directly in a parallel combination",
     "Derive 1/Rp = 1/R1 + 1/R2; show Rp is smaller than the smallest branch."),
    ("SERIES_SPLITS_I", "series_combination",
     r"series\b.*current\b.*(divide|split|share)",
     "Thinks current divides between resistors in series",
     "Current is identical in a series loop; voltage divides."),
    ("POWER_I_ONLY", "electric_power",
     r"power\b.*(=|is)\s*(v\s*/\s*i|i\s*/\s*v)|power depends only on",
     "Uses an incorrect relation for electric power",
     "Work from P = VI and combine with Ohm's law to get I²R and V²/R."),
    ("RESIST_LENGTH_INV", "resistance_factors",
     r"(longer|length)\b.*\b(less|lower|decreas)\w*\b.*resist",
     "Believes longer wires have lower resistance",
     "R = ρL/A: doubling length doubles resistance; compare a hose analogy."),
]


def analyse(concept_id: str, final_correct: bool, reasoning: str) -> Analysis:
    text = (reasoning or "").strip().lower()
    words = len(re.findall(r"\w+", text))

    for tag, cid, pat, label, fix in RULES:
        if cid == concept_id and re.search(pat, text):
            return Analysis("conceptual_misunderstanding", label,
                            0.85 if not final_correct else 0.7,
                            "medium" if not final_correct else "low",
                            0.2, fix, [tag])

    if words < 4:
        return Analysis("insufficient_evidence", None, 0.3, "low",
                        0.4 if final_correct else 0.3,
                        "Ask the student to show the steps." if not final_correct else None)

    has_formula = bool(re.search(r"[ivrpqwt]\s*=|v\s*/\s*r|i²|\bohm", text))
    if final_correct:
        return Analysis("none", None, 0.6, "low", 0.9 if has_formula else 0.7)
    if has_formula:
        return Analysis("calculation_error", None, 0.45, "low", 0.6,
                        "Formula looks reasonable; check arithmetic and units.")
    return Analysis("incomplete_reasoning", None, 0.4, "low", 0.4,
                    "Prompt the student to name the law/formula before computing.")


def validate_analysis(d: dict) -> Analysis:
    """Validate untrusted (LLM) output into an Analysis or raise ValueError."""
    cat = d.get("category")
    if cat not in CATEGORIES:
        raise ValueError(f"bad category: {cat!r}")
    conf = float(d.get("confidence", 0))
    rq = float(d.get("reasoning_quality", 0))
    if not (0 <= conf <= 1 and 0 <= rq <= 1):
        raise ValueError("confidence/reasoning_quality must be in [0,1]")
    sev = d.get("severity", "low")
    if sev not in {"low", "medium", "high"}:
        raise ValueError("bad severity")
    return Analysis(cat, d.get("misconception"), conf, sev, rq, d.get("intervention"))
