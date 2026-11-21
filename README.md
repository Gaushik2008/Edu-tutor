# edu-tutor — AdaptiveLearn AI

Adaptive exam-prep platform (Class 10 Physics: Electricity).

## Status
- [x] Learner-model engine (difficulty-aware BKT, forgetting decay) — `backend/app/core/bkt.py`
- [x] SM-2 style revision scheduler — `backend/app/core/srs.py`
- [x] Adaptive difficulty + prerequisite-aware next concept — `backend/app/core/adaptive.py`
- [x] Rule-based reasoning/misconception analyser + LLM-output validator — `backend/app/core/misconception.py`
- [x] 18 unit tests passing (`cd backend && python -m pytest -q`)
- [x] **Interactive demo** (`demo/index.html`, single file, no build): diagnostic + report, concept graph, adaptive practice with reasoning-based misconception detection, revision schedule with demo clock, teacher heatmap / misconceptions / assignments. 36 questions across 12 concepts. Same algorithms as the Python engine, ported to JS. Smoke-tested in Node; not yet browser-tested.
- [ ] FastAPI app, SQLAlchemy/PostgreSQL models, auth, LLM provider integration (not started)
- [ ] React + TypeScript + Tailwind + React Flow frontend (not started; the demo is vanilla JS)

The Teacher class in the demo is **sample data**; only the "You" row is live.

## Run tests
    cd backend && python -m pytest -q
