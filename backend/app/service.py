"""Application service layer (SQLite, standard library only).

All business rules live here: authentication, authorization, answer evaluation, mastery updates,
misconception records, revision scheduling, teacher analytics. The HTTP layer (app/main.py)
is a thin wrapper. AI output is only ever a *suggestion* validated in core/llm.py.
Student answer keys are never returned before an answer is submitted.
"""
from __future__ import annotations

import base64, hashlib, hmac, json, os, random, secrets, sqlite3, time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .core import adaptive, bkt, srs
from .core.llm import hybrid_analyse
from .core.rules_data import RULES

DATA = json.loads((Path(__file__).parent / "data" / "syllabus.json").read_text())
CONCEPTS = {c["id"]: c for c in DATA["concepts"]}
QUESTIONS = {q["id"]: q for q in DATA["questions"]}
TAGS = {r["tag"]: r for r in RULES}
ROLES = {"student", "teacher", "admin"}
SECRET = os.environ.get("APP_SECRET", secrets.token_hex(32)).encode()

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')), pw_hash TEXT NOT NULL,
  is_sample INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS classes(id INTEGER PRIMARY KEY, teacher_id INTEGER NOT NULL REFERENCES users(id), name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS class_students(class_id INTEGER NOT NULL REFERENCES classes(id),
  student_id INTEGER NOT NULL REFERENCES users(id), PRIMARY KEY(class_id, student_id));
CREATE TABLE IF NOT EXISTS student_answers(id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(id),
  question_id INTEGER NOT NULL, concept_id TEXT NOT NULL, answer TEXT NOT NULL, reasoning TEXT NOT NULL DEFAULT '',
  correct INTEGER NOT NULL, reasoning_quality REAL NOT NULL, answered_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ix_answers_student ON student_answers(student_id, concept_id, answered_at);
CREATE TABLE IF NOT EXISTS learner_mastery(student_id INTEGER NOT NULL REFERENCES users(id), concept_id TEXT NOT NULL,
  p_mastery REAL NOT NULL, confidence REAL NOT NULL, attempts INTEGER NOT NULL, correct INTEGER NOT NULL,
  last_practiced TEXT, next_review TEXT, reps INTEGER NOT NULL DEFAULT 0, ease REAL NOT NULL DEFAULT 2.3,
  interval_days REAL NOT NULL DEFAULT 0, PRIMARY KEY(student_id, concept_id));
CREATE TABLE IF NOT EXISTS mastery_history(id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL, concept_id TEXT NOT NULL,
  p_mastery REAL NOT NULL, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ix_history ON mastery_history(student_id, concept_id, at);
CREATE TABLE IF NOT EXISTS misconceptions(id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(id),
  concept_id TEXT NOT NULL, tag TEXT NOT NULL, label TEXT NOT NULL, reasoning TEXT NOT NULL, confidence REAL NOT NULL,
  severity TEXT NOT NULL, source TEXT NOT NULL CHECK(source IN ('rules','llm','option')),
  status TEXT NOT NULL CHECK(status IN ('open','needs_review','confirmed','dismissed','resolved')),
  count INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ix_mis ON misconceptions(student_id, concept_id, status);
CREATE TABLE IF NOT EXISTS revision_history(id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL, concept_id TEXT NOT NULL,
  quality REAL NOT NULL, interval_days REAL NOT NULL, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS assignments(id INTEGER PRIMARY KEY, class_id INTEGER NOT NULL REFERENCES classes(id),
  concept_ids TEXT NOT NULL, difficulty INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 5), due TEXT, created_at TEXT NOT NULL);
"""


class AuthError(Exception): pass
class Forbidden(Exception): pass
class NotFound(Exception): pass
class Invalid(Exception): pass


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

def iso(d: datetime | None) -> str | None:
    return d.isoformat(timespec="seconds") if d else None

def parse(s: str | None) -> datetime | None:
    return datetime.fromisoformat(s) if s else None


def connect(path: str = ":memory:") -> sqlite3.Connection:
    db = sqlite3.connect(path, check_same_thread=False)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript(SCHEMA)
    return db


# ---------- authentication ----------
def hash_password(pw: str) -> str:
    salt = secrets.token_bytes(16)
    return "scrypt$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(
        hashlib.scrypt(pw.encode(), salt=salt, n=2 ** 14, r=8, p=1)).decode()

def verify_password(pw: str, stored: str) -> bool:
    try:
        _, s, h = stored.split("$")
        got = hashlib.scrypt(pw.encode(), salt=base64.b64decode(s), n=2 ** 14, r=8, p=1)
        return hmac.compare_digest(got, base64.b64decode(h))
    except Exception:
        return False

def register(db, email: str, name: str, password: str, role: str = "student", *, allow_admin=False, sample=False) -> dict:
    email = (email or "").strip().lower()
    if "@" not in email or len(name.strip()) < 2: raise Invalid("Enter a valid email and name.")
    if len(password) < 8: raise Invalid("Password must be at least 8 characters.")
    if role not in ROLES or (role == "admin" and not allow_admin): raise Invalid("Role not allowed.")
    try:
        cur = db.execute("INSERT INTO users(email,name,role,pw_hash,is_sample,created_at) VALUES(?,?,?,?,?,?)",
                         (email, name.strip(), role, hash_password(password), int(sample), iso(utcnow())))
    except sqlite3.IntegrityError:
        raise Invalid("That email is already registered.")
    db.commit()
    return {"id": cur.lastrowid, "email": email, "name": name.strip(), "role": role}

def make_token(user_id: int, role: str, ttl: int = 8 * 3600) -> str:
    body = f"{user_id}.{role}.{int(time.time()) + ttl}"
    sig = hmac.new(SECRET, body.encode(), hashlib.sha256).hexdigest()
    return base64.urlsafe_b64encode(f"{body}.{sig}".encode()).decode()

def login(db, email: str, password: str) -> dict:
    row = db.execute("SELECT * FROM users WHERE email=?", ((email or "").strip().lower(),)).fetchone()
    if not row or not verify_password(password, row["pw_hash"]):
        raise AuthError("Incorrect email or password.")
    return {"token": make_token(row["id"], row["role"]), "user": public_user(row)}

def public_user(row) -> dict:
    return {"id": row["id"], "email": row["email"], "name": row["name"], "role": row["role"], "is_sample": bool(row["is_sample"])}

def authenticate(db, token: str) -> dict:
    try:
        body, sig = base64.urlsafe_b64decode(token.encode()).decode().rsplit(".", 1)
        if not hmac.compare_digest(sig, hmac.new(SECRET, body.encode(), hashlib.sha256).hexdigest()):
            raise ValueError
        uid, role, exp = body.split(".")
        if int(exp) < time.time(): raise ValueError
    except Exception:
        raise AuthError("Invalid or expired session.")
    row = db.execute("SELECT * FROM users WHERE id=?", (int(uid),)).fetchone()
    if not row or row["role"] != role: raise AuthError("Invalid or expired session.")
    return public_user(row)

def require(user: dict, *roles: str):
    if user["role"] not in roles: raise Forbidden("You do not have access to this.")


# ---------- learner model ----------
def _state(db, sid: int, cid: str) -> sqlite3.Row | None:
    return db.execute("SELECT * FROM learner_mastery WHERE student_id=? AND concept_id=?", (sid, cid)).fetchone()

def current_mastery(row, now: datetime) -> float:
    if row is None: return bkt.P_INIT
    return bkt.decayed(row["p_mastery"], parse(row["last_practiced"]), now) if row["attempts"] else row["p_mastery"]

def mastery_map(db, sid: int, now: datetime | None = None) -> list[dict]:
    now = now or utcnow()
    out = []
    for cid, c in CONCEPTS.items():
        r = _state(db, sid, cid)
        p = current_mastery(r, now)
        att = r["attempts"] if r else 0
        out.append({"concept_id": cid, "name": c["name"], "mastery": round(p * 100), "band": bkt.band(p, att),
                    "attempts": att, "correct": r["correct"] if r else 0, "confidence": round(r["confidence"], 2) if r else 0.0,
                    "next_review": r["next_review"] if r else None})
    return out

def _open_mis(db, sid: int, cid: str | None = None):
    q = "SELECT * FROM misconceptions WHERE student_id=? AND status IN ('open','needs_review','confirmed')"
    a: list = [sid]
    if cid: q += " AND concept_id=?"; a.append(cid)
    return db.execute(q, a).fetchall()


def next_question(db, sid: int, concept_id: str | None = None, now: datetime | None = None) -> dict:
    """Pick the next question adaptively. The answer key is NOT included."""
    now = now or utcnow()
    mp = {r["concept_id"]: current_mastery(r, now) for r in db.execute("SELECT * FROM learner_mastery WHERE student_id=?", (sid,))}
    att = {r["concept_id"]: r["attempts"] for r in db.execute("SELECT * FROM learner_mastery WHERE student_id=?", (sid,))}
    cid = concept_id or adaptive.next_concept(mp, att, {k: v["prereqs"] for k, v in CONCEPTS.items()})
    if cid not in CONCEPTS: raise NotFound("Unknown concept.")
    recent = [bool(r["correct"]) for r in db.execute(
        "SELECT correct FROM student_answers WHERE student_id=? AND concept_id=? ORDER BY id DESC LIMIT 6", (sid, cid))][::-1]
    target = adaptive.target_difficulty(mp.get(cid, bkt.P_INIT), recent)
    asked = [r["question_id"] for r in db.execute("SELECT question_id FROM student_answers WHERE student_id=? ORDER BY id DESC LIMIT 8", (sid,))]
    pool = [q for q in QUESTIONS.values() if q["c"] == cid and q["id"] not in asked] or [q for q in QUESTIONS.values() if q["c"] == cid]
    tags = {m["tag"] for m in _open_mis(db, sid, cid)}
    targeted = [q for q in pool if tags & (set((q.get("m") or {}).values()) | set((q.get("mw") or {}).values()))]
    pool = targeted or pool
    q = sorted(pool, key=lambda q: (abs(q["d"] - target), q["id"]))[0]
    return {"question_id": q["id"], "concept_id": cid, "concept": CONCEPTS[cid]["name"], "difficulty": q["d"], "type": q["t"],
            "question": q["q"], "options": q.get("o"), "targets_misconception": bool(targeted)}


def _grade(q: dict, answer: str) -> tuple[bool, str | None]:
    tag = None
    if q["t"] == "mcq":
        try: i = int(answer)
        except ValueError: raise Invalid("Choose one of the options.")
        return i == q["a"], (q.get("m") or {}).get(str(i))
    if q["t"] == "num":
        try: x = float(answer)
        except ValueError: raise Invalid("Enter a number.")
        ok = abs(x - q["a"]) <= q["tol"] * abs(q["a"])
        if not ok:
            for k, t in (q.get("mw") or {}).items():
                if abs(x - float(k)) < 1e-9: tag = t
        return ok, tag
    return any(k in answer.lower() for k in q["a"]), None


def submit_answer(db, sid: int, question_id: int, answer: str, reasoning: str = "", *, provider=None, now: datetime | None = None) -> dict:
    """Evaluate one answer, update the learner model deterministically, record any misconception."""
    now = now or utcnow()
    q = QUESTIONS.get(question_id)
    if not q: raise NotFound("Unknown question.")
    answer, reasoning = str(answer).strip(), (reasoning or "").strip()[:2000]
    if not answer: raise Invalid("Enter an answer first.")
    ok, option_tag = _grade(q, answer)
    an = hybrid_analyse(q["c"], ok, reasoning, provider)
    tag, source, conf = (an.tags[0], an.source, an.confidence) if an.tags else (None, None, 0.0)
    if not tag and option_tag and not ok:
        tag, source, conf = option_tag, "option", 0.75
    cid = q["c"]
    row = _state(db, sid, cid)
    before = current_mastery(row, now)
    seen = db.execute("SELECT 1 FROM (SELECT question_id FROM student_answers WHERE student_id=? ORDER BY id DESC LIMIT 8) WHERE question_id=?", (sid, question_id)).fetchone()
    st = bkt.MasteryState(before, row["attempts"] if row else 0, row["correct"] if row else 0, row["confidence"] if row else 0.0)
    new = bkt.update(st, ok, q["d"], an.reasoning_quality, 0.5 if seen else 1.0)
    db.execute("INSERT INTO student_answers(student_id,question_id,concept_id,answer,reasoning,correct,reasoning_quality,answered_at) VALUES(?,?,?,?,?,?,?,?)",
               (sid, question_id, cid, answer, reasoning, int(ok), an.reasoning_quality, iso(now)))
    mis_rec = None
    if tag:
        existing = db.execute("SELECT * FROM misconceptions WHERE student_id=? AND concept_id=? AND tag=? AND status IN ('open','needs_review','confirmed')", (sid, cid, tag)).fetchone()
        status = "open" if source in ("rules", "option") and conf >= 0.75 else "needs_review"
        if existing:
            db.execute("UPDATE misconceptions SET count=count+1, updated_at=?, reasoning=? WHERE id=?", (iso(now), reasoning or existing["reasoning"], existing["id"]))
            mis_rec = existing["id"]
        else:
            mis_rec = db.execute("INSERT INTO misconceptions(student_id,concept_id,tag,label,reasoning,confidence,severity,source,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                                 (sid, cid, tag, TAGS[tag]["label"], reasoning or "(no written reasoning)", conf,
                                  "medium" if not ok else "low", source, status, iso(now), iso(now))).lastrowid
    elif ok:
        last2 = [r["correct"] for r in db.execute("SELECT correct FROM student_answers WHERE student_id=? AND concept_id=? ORDER BY id DESC LIMIT 2", (sid, cid))]
        if len(last2) == 2 and all(last2):
            db.execute("UPDATE misconceptions SET status='resolved', updated_at=? WHERE student_id=? AND concept_id=? AND status IN ('open','needs_review','confirmed')", (iso(now), sid, cid))
    quality = 0.6 * ok + 0.4 * an.reasoning_quality
    rs, due = srs.schedule(srs.ReviewState(row["reps"] if row else 0, row["ease"] if row else 2.3, row["interval_days"] if row else 0.0),
                           quality, now, CONCEPTS[cid]["difficulty"], bool(_open_mis(db, sid, cid)))
    db.execute("""INSERT INTO learner_mastery(student_id,concept_id,p_mastery,confidence,attempts,correct,last_practiced,next_review,reps,ease,interval_days)
                  VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(student_id,concept_id) DO UPDATE SET p_mastery=excluded.p_mastery,
                  confidence=excluded.confidence, attempts=excluded.attempts, correct=excluded.correct, last_practiced=excluded.last_practiced,
                  next_review=excluded.next_review, reps=excluded.reps, ease=excluded.ease, interval_days=excluded.interval_days""",
               (sid, cid, new.p_mastery, new.confidence, new.attempts, new.correct, iso(now), iso(due), rs.repetitions, rs.ease, rs.interval_days))
    db.execute("INSERT INTO mastery_history(student_id,concept_id,p_mastery,at) VALUES(?,?,?,?)", (sid, cid, new.p_mastery, iso(now)))
    if row and row["next_review"] and parse(row["next_review"]) <= now:
        db.execute("INSERT INTO revision_history(student_id,concept_id,quality,interval_days,at) VALUES(?,?,?,?,?)", (sid, cid, quality, rs.interval_days, iso(now)))
    db.commit()
    return {"correct": ok, "explanation": q["ex"], "reasoning_feedback": an.category,
            "misconception": {"id": mis_rec, "label": TAGS[tag]["label"], "confidence": round(conf, 2), "suggestion": TAGS[tag]["fix"],
                              "note": "A prediction from your answer, not a certainty."} if tag else None,
            "mastery_before": round(before * 100), "mastery_after": round(new.p_mastery * 100),
            "next_review": iso(due)}


def dashboard(db, sid: int, now: datetime | None = None) -> dict:
    now = now or utcnow()
    mm = mastery_map(db, sid, now)
    assessed = [m for m in mm if m["attempts"]]
    tot = db.execute("SELECT COUNT(*) n, COALESCE(SUM(correct),0) c FROM student_answers WHERE student_id=?", (sid,)).fetchone()
    due = [m for m in mm if m["next_review"] and parse(m["next_review"]) <= now]
    return {"overall_mastery": round(sum(m["mastery"] for m in assessed) / len(assessed)) if assessed else None,
            "bands": {b: sum(1 for m in mm if m["band"] == b) for b in ("mastered", "developing", "weak", "not_assessed")},
            "questions_attempted": tot["n"], "accuracy": round(tot["c"] / tot["n"], 2) if tot["n"] else None,
            "revision_due": [{"concept_id": m["concept_id"], "name": m["name"], "due": m["next_review"]} for m in due],
            "open_misconceptions": [dict(label=m["label"], concept_id=m["concept_id"], status=m["status"]) for m in _open_mis(db, sid)]}


# ---------- teacher ----------
def _class_for(db, teacher: dict, class_id: int) -> sqlite3.Row:
    require(teacher, "teacher", "admin")
    c = db.execute("SELECT * FROM classes WHERE id=?", (class_id,)).fetchone()
    if not c: raise NotFound("Class not found.")
    if teacher["role"] != "admin" and c["teacher_id"] != teacher["id"]:
        raise Forbidden("This is not your class.")
    return c

def teacher_classes(db, teacher: dict) -> list[dict]:
    require(teacher, "teacher", "admin")
    rows = db.execute("SELECT c.id,c.name,(SELECT COUNT(*) FROM class_students s WHERE s.class_id=c.id) n FROM classes c WHERE c.teacher_id=? OR ?='admin'", (teacher["id"], teacher["role"])).fetchall()
    return [dict(r) for r in rows]

def class_heatmap(db, teacher: dict, class_id: int, now: datetime | None = None) -> dict:
    _class_for(db, teacher, class_id)
    students = db.execute("SELECT u.* FROM users u JOIN class_students s ON s.student_id=u.id WHERE s.class_id=? ORDER BY u.name", (class_id,)).fetchall()
    rows = []
    for u in students:
        mm = mastery_map(db, u["id"], now)
        rows.append({"student_id": u["id"], "name": u["name"], "is_sample": bool(u["is_sample"]),
                     "cells": {m["concept_id"]: (m["mastery"] if m["attempts"] else None) for m in mm}})
    cols = []
    for cid, c in CONCEPTS.items():
        vals = [r["cells"][cid] for r in rows if r["cells"][cid] is not None]
        cols.append({"concept_id": cid, "name": c["name"], "assessed": len(vals),
                     "average": round(sum(vals) / len(vals)) if vals else None, "weak": sum(1 for v in vals if v < 50)})
    hard = sorted([c for c in cols if c["average"] is not None], key=lambda c: c["average"])[:3]
    return {"students": rows, "concepts": cols, "hardest_concepts": hard}

def class_misconceptions(db, teacher: dict, class_id: int) -> list[dict]:
    _class_for(db, teacher, class_id)
    rows = db.execute("""SELECT m.tag, m.concept_id, COUNT(DISTINCT m.student_id) students, MIN(m.reasoning) example
      FROM misconceptions m JOIN class_students s ON s.student_id=m.student_id
      WHERE s.class_id=? AND m.status IN ('open','needs_review','confirmed') GROUP BY m.tag, m.concept_id ORDER BY students DESC""", (class_id,)).fetchall()
    return [{"tag": r["tag"], "label": TAGS[r["tag"]]["label"], "concept": CONCEPTS[r["concept_id"]]["name"],
             "students_affected": r["students"], "example_reasoning": r["example"], "intervention": TAGS[r["tag"]]["fix"]} for r in rows]

def review_queue(db, teacher: dict, class_id: int) -> list[dict]:
    """Uncertain predictions awaiting a teacher's decision (LLM output or low confidence)."""
    _class_for(db, teacher, class_id)
    rows = db.execute("""SELECT m.*, u.name FROM misconceptions m JOIN class_students s ON s.student_id=m.student_id JOIN users u ON u.id=m.student_id
      WHERE s.class_id=? AND m.status='needs_review' ORDER BY m.confidence""", (class_id,)).fetchall()
    return [{"id": r["id"], "student": r["name"], "concept": CONCEPTS[r["concept_id"]]["name"], "label": r["label"],
             "reasoning": r["reasoning"], "confidence": r["confidence"], "source": r["source"]} for r in rows]

def review_misconception(db, teacher: dict, misconception_id: int, decision: str) -> dict:
    if decision not in ("confirm", "dismiss"): raise Invalid("Decision must be confirm or dismiss.")
    m = db.execute("SELECT m.*, s.class_id FROM misconceptions m JOIN class_students s ON s.student_id=m.student_id WHERE m.id=?", (misconception_id,)).fetchone()
    if not m: raise NotFound("Misconception not found.")
    _class_for(db, teacher, m["class_id"])
    db.execute("UPDATE misconceptions SET status=?, updated_at=? WHERE id=?", ("confirmed" if decision == "confirm" else "dismissed", iso(utcnow()), misconception_id))
    db.commit()
    return {"id": misconception_id, "status": "confirmed" if decision == "confirm" else "dismissed"}

def student_detail(db, teacher: dict, student_id: int, now: datetime | None = None) -> dict:
    require(teacher, "teacher", "admin")
    ok = db.execute("SELECT 1 FROM class_students s JOIN classes c ON c.id=s.class_id WHERE s.student_id=? AND (c.teacher_id=? OR ?='admin')",
                    (student_id, teacher["id"], teacher["role"])).fetchone()
    if not ok: raise Forbidden("This student is not in your class.")
    hist = db.execute("SELECT concept_id, p_mastery, at FROM mastery_history WHERE student_id=? ORDER BY at", (student_id,)).fetchall()
    return {"mastery": mastery_map(db, student_id, now), "history": [dict(h) for h in hist],
            "misconceptions": [dict(label=m["label"], status=m["status"], confidence=m["confidence"], reasoning=m["reasoning"]) for m in _open_mis(db, student_id)]}

def create_assignment(db, teacher: dict, class_id: int, concept_ids: list[str], difficulty: int, due: str | None) -> dict:
    _class_for(db, teacher, class_id)
    if not concept_ids or any(c not in CONCEPTS for c in concept_ids): raise Invalid("Choose valid concepts.")
    if not 1 <= int(difficulty) <= 5: raise Invalid("Difficulty must be 1-5.")
    cur = db.execute("INSERT INTO assignments(class_id,concept_ids,difficulty,due,created_at) VALUES(?,?,?,?,?)", (class_id, json.dumps(concept_ids), int(difficulty), due, iso(utcnow())))
    db.commit()
    return {"id": cur.lastrowid}


# ---------- demo data (clearly flagged as sample) ----------
SAMPLE_PROFILES = {  # name -> {concept_id: probability of answering correctly}
    "Sample student A": 0.85, "Sample student B": 0.45, "Sample student C": 0.70,
    "Sample student D": 0.30, "Sample student E": 0.90, "Sample student F": 0.40}

def seed_demo(db, *, seed: int = 11) -> dict:
    """Create a sample teacher, class and six sample students whose mastery comes from running
    simulated answers through the real engine. Every record is flagged is_sample."""
    rnd = random.Random(seed)
    t = register(db, "teacher@demo.example", "Demo Teacher", "demo-password", "teacher", sample=True)
    cls = db.execute("INSERT INTO classes(teacher_id,name) VALUES(?,?)", (t["id"], "Class 10 Physics (sample class)")).lastrowid
    wrong_reasons = {tag: {"R_UP_I_UP": "current increases because resistance blocks the voltage so current is higher", "CURRENT_USED_UP": "the bulb uses up some of the current"}.get(tag, "") for tag in TAGS}
    base = utcnow() - timedelta(days=14)
    students = []
    for i, (name, skill) in enumerate(SAMPLE_PROFILES.items()):
        u = register(db, f"student{i + 1}@demo.example", name, "demo-password", "student", sample=True)
        db.execute("INSERT INTO class_students(class_id,student_id) VALUES(?,?)", (cls, u["id"]))
        students.append(u)
        day = 0
        for cid in CONCEPTS:
            if rnd.random() < 0.15: continue  # not assessed yet
            qs = [q for q in QUESTIONS.values() if q["c"] == cid]
            for q in rnd.sample(qs, min(len(qs), 3)):
                good = rnd.random() < skill - 0.05 * (q["d"] - 2)
                if q["t"] == "mcq":
                    wrong = [k for k in range(len(q["o"])) if k != q["a"]]
                    tagged = [int(k) for k in (q.get("m") or {})]
                    ans = str(q["a"]) if good else str(rnd.choice(tagged or wrong))
                elif q["t"] == "num":
                    ans = str(q["a"]) if good else str(q["a"] * 1.7 + 1)
                else:
                    ans = q["a"][0] if good else "not sure"
                why = "" if good else wrong_reasons.get(next(iter((q.get("m") or {}).values()), ""), "")
                day += 1
                submit_answer(db, u["id"], q["id"], ans, why, now=base + timedelta(hours=7 * day))
    db.commit()
    return {"teacher": "teacher@demo.example", "class_id": cls, "students": [s["email"] for s in students], "password": "demo-password"}
