"""FastAPI HTTP layer over app/service.py.

NOT RUN IN THIS REPOSITORY'S DEVELOPMENT SESSION: FastAPI could not be installed there, so this file is only
syntax-checked. All logic it calls (app/service.py) is covered by tests. Run it with:
    pip install -r backend/requirements.txt
    uvicorn app.main:app --reload --app-dir backend
"""
from __future__ import annotations

import os
import time
from collections import defaultdict, deque

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from . import service as S
from .core.llm import AnthropicProvider

app = FastAPI(title="AdaptiveLearn AI", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(","),
                   allow_methods=["*"], allow_headers=["*"])
DB = S.connect(os.environ.get("DATABASE_PATH", "adaptivelearn.db"))
_provider = AnthropicProvider()
PROVIDER = _provider if _provider.available else None   # no key -> rule-based fallback only
_hits: dict[int, deque] = defaultdict(deque)


def user(authorization: str = Header(default="")) -> dict:
    try:
        return S.authenticate(DB, authorization.removeprefix("Bearer ").strip())
    except S.AuthError as e:
        raise HTTPException(401, str(e))


def call(fn, *a, **k):
    try:
        return fn(*a, **k)
    except S.Invalid as e: raise HTTPException(422, str(e))
    except S.AuthError as e: raise HTTPException(401, str(e))
    except S.Forbidden as e: raise HTTPException(403, str(e))
    except S.NotFound as e: raise HTTPException(404, str(e))


def rate_limit(u: dict, limit: int = 30, window: int = 60):
    q = _hits[u["id"]]; now = time.time()
    while q and q[0] < now - window: q.popleft()
    if len(q) >= limit: raise HTTPException(429, "Too many answers too quickly. Wait a moment.")
    q.append(now)


class RegisterIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=8, max_length=128)
    role: str = "student"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class AnswerIn(BaseModel):
    answer: str = Field(min_length=1, max_length=500)
    reasoning: str = Field(default="", max_length=2000)

class AssignmentIn(BaseModel):
    class_id: int
    concept_ids: list[str]
    difficulty: int = Field(ge=1, le=5)
    due: str | None = None

class ReviewIn(BaseModel):
    decision: str


@app.get("/api/health")
def health(): return {"ok": True, "ai_provider": bool(PROVIDER)}

@app.post("/api/auth/register", status_code=201)
def register(b: RegisterIn): return call(S.register, DB, b.email, b.name, b.password, b.role)

@app.post("/api/auth/login")
def login(b: LoginIn): return call(S.login, DB, b.email, b.password)

@app.get("/api/auth/me")
def me(u: dict = Depends(user)): return u

@app.get("/api/concepts")
def concepts(u: dict = Depends(user)): return list(S.CONCEPTS.values())

@app.get("/api/student/dashboard")
def dashboard(u: dict = Depends(user)): S.require(u, "student"); return S.dashboard(DB, u["id"])

@app.get("/api/student/mastery")
def mastery(u: dict = Depends(user)): S.require(u, "student"); return S.mastery_map(DB, u["id"])

@app.get("/api/questions/next")
def next_q(concept_id: str | None = None, u: dict = Depends(user)):
    S.require(u, "student"); return call(S.next_question, DB, u["id"], concept_id)

@app.post("/api/questions/{question_id}/evaluate")
def evaluate(question_id: int, b: AnswerIn, u: dict = Depends(user)):
    S.require(u, "student"); rate_limit(u)
    return call(S.submit_answer, DB, u["id"], question_id, b.answer, b.reasoning, provider=PROVIDER)

@app.get("/api/teacher/classes")
def classes(u: dict = Depends(user)): return call(S.teacher_classes, DB, u)

@app.get("/api/teacher/classes/{class_id}/heatmap")
def heatmap(class_id: int, u: dict = Depends(user)): return call(S.class_heatmap, DB, u, class_id)

@app.get("/api/teacher/classes/{class_id}/misconceptions")
def class_mis(class_id: int, u: dict = Depends(user)): return call(S.class_misconceptions, DB, u, class_id)

@app.get("/api/teacher/classes/{class_id}/review-queue")
def queue(class_id: int, u: dict = Depends(user)): return call(S.review_queue, DB, u, class_id)

@app.post("/api/teacher/misconceptions/{mid}/review")
def review(mid: int, b: ReviewIn, u: dict = Depends(user)): return call(S.review_misconception, DB, u, mid, b.decision)

@app.get("/api/teacher/students/{student_id}")
def student(student_id: int, u: dict = Depends(user)): return call(S.student_detail, DB, u, student_id)

@app.post("/api/teacher/assignments", status_code=201)
def assign(b: AssignmentIn, u: dict = Depends(user)):
    return call(S.create_assignment, DB, u, b.class_id, b.concept_ids, b.difficulty, b.due)

if os.environ.get("DEMO_MODE") == "1":
    @app.post("/api/demo/seed")
    def seed(): return call(S.seed_demo, DB)   # creates flagged sample teacher, class and students
