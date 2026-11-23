import sys
from datetime import datetime, timedelta
from pathlib import Path
import pytest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import service as S  # noqa: E402

T0 = datetime(2026, 1, 1, 9, 0)

@pytest.fixture()
def db():
    return S.connect(":memory:")

def mk(db, email, role="student", name="Test User"):
    S.register(db, email, name, "password123", role)
    return S.authenticate(db, S.login(db, email, "password123")["token"])

# --- auth ---
def test_register_login_and_bad_password(db):
    u = mk(db, "a@x.io")
    assert u["role"] == "student"
    with pytest.raises(S.AuthError): S.login(db, "a@x.io", "wrong-password")
    with pytest.raises(S.Invalid): S.register(db, "a@x.io", "Dup", "password123")   # duplicate
    with pytest.raises(S.Invalid): S.register(db, "b@x.io", "Short", "short")        # weak password
    with pytest.raises(S.Invalid): S.register(db, "c@x.io", "Adm", "password123", "admin")  # no self-serve admin

def test_password_is_hashed_not_stored(db):
    mk(db, "a@x.io")
    assert "password123" not in db.execute("SELECT pw_hash FROM users").fetchone()[0]

def test_token_tamper_and_expiry(db):
    u = mk(db, "a@x.io")
    tok = S.login(db, "a@x.io", "password123")["token"]
    with pytest.raises(S.AuthError): S.authenticate(db, tok[:-4] + "AAAA")
    with pytest.raises(S.AuthError): S.authenticate(db, S.make_token(u["id"], "student", ttl=-10))
    with pytest.raises(S.AuthError): S.authenticate(db, S.make_token(u["id"], "teacher"))  # role mismatch

# --- questions never leak the key ---
def test_next_question_has_no_answer_key(db):
    u = mk(db, "a@x.io")
    q = S.next_question(db, u["id"])
    assert not {"a", "ex", "answer", "correct", "explanation", "m", "mw", "tol"} & set(q)
    assert q["concept_id"] == "electric_charge"        # foundations first

# --- learner model through the service ---
def test_correct_answer_raises_mastery_and_schedules_review(db):
    u = mk(db, "a@x.io")
    r = S.submit_answer(db, u["id"], 14, "3", "I = V/R = 12/4", now=T0)
    assert r["correct"] and r["mastery_after"] > r["mastery_before"]
    assert S.parse(r["next_review"]) > T0
    assert db.execute("SELECT COUNT(*) FROM mastery_history").fetchone()[0] == 1

def test_wrong_answer_never_raises_mastery(db):
    u = mk(db, "a@x.io")
    r = S.submit_answer(db, u["id"], 14, "99", "no idea really", now=T0)
    assert not r["correct"] and r["mastery_after"] <= r["mastery_before"]

def test_misconception_recorded_and_targeted_followup(db):
    u = mk(db, "a@x.io")
    r = S.submit_answer(db, u["id"], 15, "0", "Current increases because resistance increases and blocks the voltage", now=T0)
    assert r["misconception"] and "resistance" in r["misconception"]["label"].lower()
    row = db.execute("SELECT * FROM misconceptions").fetchone()
    assert row["tag"] == "R_UP_I_UP" and row["status"] == "open" and row["source"] == "rules"
    nxt = S.next_question(db, u["id"], "ohms_law", now=T0)
    assert nxt["targets_misconception"] is True
    assert S.next_question(db, u["id"], "ohms_law", now=T0)["question_id"] in (15, 37)

def test_misconception_resolves_after_two_correct(db):
    u = mk(db, "a@x.io")
    S.submit_answer(db, u["id"], 15, "0", "Current increases because resistance increases", now=T0)
    S.submit_answer(db, u["id"], 14, "3", "I = V/R", now=T0 + timedelta(hours=1))
    S.submit_answer(db, u["id"], 13, "0", "V = IR", now=T0 + timedelta(hours=2))
    assert db.execute("SELECT status FROM misconceptions").fetchone()[0] == "resolved"

def test_open_misconception_shortens_revision_interval(db):
    u = mk(db, "a@x.io")
    for i, qid in enumerate((13, 14, 16)):
        S.submit_answer(db, u["id"], qid, {13: "0", 14: "3", 16: "1.5"}[qid], "V = IR so I = V/R", now=T0 + timedelta(days=i))
    clean = db.execute("SELECT interval_days FROM learner_mastery WHERE concept_id='ohms_law'").fetchone()[0]
    v = mk(db, "b@x.io")
    S.submit_answer(db, v["id"], 15, "0", "Current increases because resistance increases", now=T0)
    flagged = db.execute("SELECT interval_days FROM learner_mastery WHERE student_id=?", (v["id"],)).fetchone()[0]
    assert flagged <= 3 and flagged <= clean

def test_invalid_inputs(db):
    u = mk(db, "a@x.io")
    with pytest.raises(S.NotFound): S.submit_answer(db, u["id"], 9999, "1")
    with pytest.raises(S.Invalid): S.submit_answer(db, u["id"], 14, "abc")
    with pytest.raises(S.Invalid): S.submit_answer(db, u["id"], 14, "   ")

def test_dashboard_reflects_real_rows(db):
    u = mk(db, "a@x.io")
    assert S.dashboard(db, u["id"])["questions_attempted"] == 0
    S.submit_answer(db, u["id"], 14, "3", "I = V/R", now=T0)
    d = S.dashboard(db, u["id"], now=T0 + timedelta(days=2))
    assert d["questions_attempted"] == 1 and d["accuracy"] == 1.0 and d["bands"]["not_assessed"] == 11
    assert any(r["concept_id"] == "ohms_law" for r in d["revision_due"])

# --- teacher authorization ---
def classroom(db):
    t = mk(db, "t@x.io", "teacher", "Teacher One"); t2 = mk(db, "t2@x.io", "teacher", "Teacher Two")
    s1 = mk(db, "s1@x.io", name="Student One"); s2 = mk(db, "s2@x.io", name="Student Two")
    cid = db.execute("INSERT INTO classes(teacher_id,name) VALUES(?,?)", (t["id"], "C1")).lastrowid
    db.execute("INSERT INTO class_students VALUES(?,?)", (cid, s1["id"])); db.commit()
    return t, t2, s1, s2, cid

def test_teacher_sees_only_own_class(db):
    t, t2, s1, s2, cid = classroom(db)
    S.submit_answer(db, s1["id"], 14, "3", "I = V/R", now=T0)
    hm = S.class_heatmap(db, t, cid, now=T0)
    assert [r["name"] for r in hm["students"]] == ["Student One"] and hm["students"][0]["cells"]["ohms_law"] is not None
    with pytest.raises(S.Forbidden): S.class_heatmap(db, t2, cid)
    with pytest.raises(S.Forbidden): S.class_heatmap(db, s1, cid)              # student role
    with pytest.raises(S.Forbidden): S.student_detail(db, t2, s1["id"])
    with pytest.raises(S.Forbidden): S.student_detail(db, t, s2["id"])         # not in class
    assert S.student_detail(db, t, s1["id"])["history"]

def test_class_misconceptions_and_review_queue(db):
    t, t2, s1, s2, cid = classroom(db)
    S.submit_answer(db, s1["id"], 15, "0", "Current increases because resistance increases", now=T0)
    ms = S.class_misconceptions(db, t, cid)
    assert ms[0]["students_affected"] == 1 and ms[0]["intervention"]
    db.execute("UPDATE misconceptions SET status='needs_review', confidence=0.5"); db.commit()
    q = S.review_queue(db, t, cid)
    assert len(q) == 1 and q[0]["student"] == "Student One"
    with pytest.raises(S.Forbidden): S.review_misconception(db, t2, q[0]["id"], "confirm")
    assert S.review_misconception(db, t, q[0]["id"], "dismiss")["status"] == "dismissed"
    assert S.review_queue(db, t, cid) == []

def test_assignment_validation(db):
    t, t2, s1, s2, cid = classroom(db)
    assert S.create_assignment(db, t, cid, ["ohms_law"], 2, "2026-12-01")["id"]
    with pytest.raises(S.Invalid): S.create_assignment(db, t, cid, ["nope"], 2, None)
    with pytest.raises(S.Invalid): S.create_assignment(db, t, cid, ["ohms_law"], 9, None)
    with pytest.raises(S.Forbidden): S.create_assignment(db, t2, cid, ["ohms_law"], 2, None)

# --- LLM path with a fake provider ---
class Fake:
    def __init__(self, out): self.out, self.calls = out, 0
    def complete(self, system, user): self.calls += 1; return self.out

def test_llm_suggestion_is_validated_and_sent_to_review(db):
    u = mk(db, "a@x.io")
    good = '{"category":"conceptual_misunderstanding","tag":"R_UP_I_UP","confidence":0.9,"reasoning_quality":0.3,"severity":"medium"}'
    p = Fake(good)
    r = S.submit_answer(db, u["id"], 15, "2", "bigger resistor means bigger current will go thru it", provider=p, now=T0)  # option 2: wrong but untagged
    assert p.calls == 1 and r["misconception"]
    row = db.execute("SELECT * FROM misconceptions").fetchone()
    assert row["source"] == "llm" and row["confidence"] <= 0.8 and row["status"] == "needs_review"      # model output is capped and reviewable

@pytest.mark.parametrize("bad", ["not json", '{"category":"nope","confidence":.5,"reasoning_quality":.5}',
    '{"category":"conceptual_misunderstanding","tag":"MADE_UP","confidence":.9,"reasoning_quality":.5}',
    '{"category":"conceptual_misunderstanding","tag":"PARALLEL_ADDS","confidence":.9,"reasoning_quality":.5}',  # wrong concept
    '{"category":"none","confidence":7,"reasoning_quality":.5}'])
def test_invalid_llm_output_falls_back_safely(db, bad):
    u = mk(db, "a@x.io")
    r = S.submit_answer(db, u["id"], 15, "2", "bigger resistor means bigger current will go thru it", provider=Fake(bad), now=T0)
    assert r["misconception"] is None and r["correct"] is False        # answer still saved, no crash
    assert db.execute("SELECT COUNT(*) FROM student_answers").fetchone()[0] == 1

# --- demo seed ---
def test_seed_demo_is_flagged_sample_and_drives_heatmap(db):
    info = S.seed_demo(db)
    assert db.execute("SELECT COUNT(*) FROM users WHERE is_sample=0").fetchone()[0] == 0
    t = S.authenticate(db, S.login(db, info["teacher"], info["password"])["token"])
    hm = S.class_heatmap(db, t, info["class_id"])
    assert len(hm["students"]) == 6 and all(r["is_sample"] for r in hm["students"])
    assert hm["hardest_concepts"] and S.class_misconceptions(db, t, info["class_id"])

def test_option_linked_misconception_even_without_reasoning(db):
    u = mk(db, "a@x.io")
    r = S.submit_answer(db, u["id"], 15, "0", "", now=T0)   # the tagged wrong option
    assert r["misconception"] and db.execute("SELECT source FROM misconceptions").fetchone()[0] == "option"

def test_rule_hit_skips_the_llm(db):
    u = mk(db, "a@x.io"); p = Fake("{}")
    S.submit_answer(db, u["id"], 15, "2", "Current increases because resistance increases and blocks the voltage", provider=p, now=T0)
    assert p.calls == 0
