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
    source: str = "rules"  # 'rules' or 'llm'


from .rules_data import RULES

_NEG = re.compile(r"\b(not|never|no|isn't|doesn't|don't|wasn't)\b|n't")


def _match_rule(rule: dict, text: str) -> bool:
    if any(re.search(u, text) for u in rule.get("unless", [])):
        return False
    for pat in rule["patterns"]:
        m = re.search(pat, text)
        if m and not _NEG.search(text[max(0, m.start() - 20): m.end()]):
            return True
    return False


def analyse(concept_id: str, final_correct: bool, reasoning: str) -> Analysis:
    text = (reasoning or "").strip().lower()
    words = len(re.findall(r"\w+", text))

    for rule in RULES:
        if rule["concept"] == concept_id and _match_rule(rule, text):
            return Analysis("conceptual_misunderstanding", rule["label"],
                            0.85 if not final_correct else 0.7,
                            "medium" if not final_correct else "low",
                            0.2, rule["fix"], [rule["tag"]])

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
