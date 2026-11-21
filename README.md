# edu-tutor — AdaptiveLearn AI

Adaptive exam-prep platform (Class 10 Physics: Electricity).

## Status
- [x] Learner-model engine (difficulty-aware BKT, forgetting decay) — `backend/app/core/bkt.py`
- [x] SM-2 style revision scheduler — `backend/app/core/srs.py`
- [x] Adaptive difficulty + prerequisite-aware next concept — `backend/app/core/adaptive.py`
- [x] Rule-based reasoning/misconception analyser + LLM-output validator — `backend/app/core/misconception.py`
- [x] 15 unit tests passing
- [ ] FastAPI app, SQLAlchemy models, seed data, React frontend (not started)

## Run tests
    cd backend && python -m pytest -q
