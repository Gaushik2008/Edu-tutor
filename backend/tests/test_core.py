import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core import adaptive, bkt, misconception, srs  # noqa: E402


def test_correct_raises_wrong_lowers():
    s = bkt.MasteryState()
    assert bkt.update(s, True).p_mastery > s.p_mastery
    # a wrong answer lowers the posterior even after the learning transition
    s2 = bkt.MasteryState(p_mastery=0.8, attempts=5)
    assert bkt.update(s2, False, difficulty=2).p_mastery < 0.8


def test_hard_correct_is_stronger_evidence():
    s = bkt.MasteryState(p_mastery=0.4)
    easy = bkt.update(s, True, difficulty=1).p_mastery
    hard = bkt.update(s, True, difficulty=5).p_mastery
    assert hard > easy


def test_poor_reasoning_dampens_correct_answer():
    s = bkt.MasteryState(p_mastery=0.4)
    full = bkt.update(s, True, reasoning_quality=1.0).p_mastery
    weak = bkt.update(s, True, reasoning_quality=0.1).p_mastery
    assert weak < full


def test_wrong_answer_never_raises_mastery():
    for p0 in (0.05, 0.3, 0.6, 0.9):
        s = bkt.MasteryState(p_mastery=p0, attempts=2)
        for d in range(1, 6):
            for rq in (0.0, 0.5, 1.0):
                assert bkt.update(s, False, d, rq).p_mastery <= p0


def test_repeated_question_is_weaker_evidence():
    s = bkt.MasteryState(p_mastery=0.4)
    assert bkt.update(s, True, novelty=0.5).p_mastery < bkt.update(s, True).p_mastery


def test_mastery_is_capped_below_certainty():
    s = bkt.MasteryState(p_mastery=0.97)
    for _ in range(20):
        s = bkt.update(s, True, difficulty=5)
    assert s.p_mastery <= 0.98


def test_one_wrong_answer_does_not_zero_mastery():
    s = bkt.MasteryState(p_mastery=0.7, attempts=6, correct=5)
    assert bkt.update(s, False).p_mastery > 0.2


def test_confidence_grows_with_attempts():
    s = bkt.MasteryState()
    c = []
    for _ in range(5):
        s = bkt.update(s, True)
        c.append(s.confidence)
    assert c == sorted(c) and c[-1] > c[0]


def test_decay_toward_prior():
    now = datetime(2026, 1, 1)
    p = bkt.decayed(0.9, now - timedelta(days=60), now)
    assert bkt.P_INIT < p < 0.9


def test_bands():
    assert bkt.band(0.9, 0) == "not_assessed"
    assert bkt.band(0.9, 3) == "mastered"
    assert bkt.band(0.6, 3) == "developing"
    assert bkt.band(0.2, 3) == "weak"


def test_srs_ladder_and_failure_reset():
    now = datetime(2026, 1, 1)
    st = srs.ReviewState()
    days = []
    for _ in range(4):
        st, due = srs.schedule(st, 1.0, now, difficulty=3)
        days.append((due - now).days)
    assert days == sorted(days) and days[0] <= 1
    st, due = srs.schedule(st, 0.2, now)
    assert st.repetitions == 0 and (due - now).days == 1


def test_srs_open_misconception_caps_interval():
    now = datetime(2026, 1, 1)
    st = srs.ReviewState(repetitions=3, ease=2.5, interval_days=14)
    _, due = srs.schedule(st, 1.0, now, misconception_open=True)
    assert (due - now).days <= 3


def test_difficulty_rules():
    assert adaptive.target_difficulty(0.1, []) == 1
    assert adaptive.target_difficulty(0.9, []) == 5
    assert adaptive.target_difficulty(0.5, [False, False]) < adaptive.target_difficulty(0.5, [])
    assert adaptive.target_difficulty(0.5, [True, True, True]) > adaptive.target_difficulty(0.5, [])


def test_next_concept_respects_prereqs():
    prereqs = {"a": [], "b": ["a"], "c": ["b"]}
    assert adaptive.next_concept({}, {}, prereqs) == "a"
    m = {"a": 0.9, "b": 0.2}
    at = {"a": 4, "b": 3}
    assert adaptive.next_concept(m, at, prereqs) == "b"


def test_misconception_from_example():
    a = misconception.analyse(
        "ohms_law", False,
        "Current increases because resistance increases and blocks the voltage, so current is higher")
    assert a.category == "conceptual_misunderstanding"
    assert a.confidence > 0.7 and a.misconception


def test_correct_with_formula_is_none():
    a = misconception.analyse("ohms_law", True, "I = V/R so more R means less current")
    assert a.category == "none" and a.reasoning_quality >= 0.7


def test_short_reasoning_is_insufficient():
    assert misconception.analyse("ohms_law", False, "idk").category == "insufficient_evidence"


def test_validate_rejects_bad_llm_output():
    with pytest.raises(ValueError):
        misconception.validate_analysis({"category": "nope", "confidence": 0.5})
    with pytest.raises(ValueError):
        misconception.validate_analysis({"category": "none", "confidence": 2, "reasoning_quality": 0.5})
