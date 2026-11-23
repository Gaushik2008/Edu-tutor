# Learnova (`edu-tutor`)

> **Learn Smarter. Understand Deeper. Remember Longer.**

An adaptive exam-preparation platform that models what each student *understands*, not just whether they got a question right. It tracks mastery per concept, reads the student's written reasoning to spot likely misconceptions, adapts question difficulty, schedules spaced-repetition revision, and gives teachers a class-wide view of knowledge gaps.

The first syllabus is **Class 10 Physics: Electricity** (12 concepts, 39 questions, 12 animated video lessons).

**Live demo:** https://gaushik2008.github.io/Edu-tutor/ (GitHub Pages; the page is `index.html` at the repo root).

---

## Contents

1. [Project status at a glance](#1-project-status-at-a-glance)
2. [What the demo does](#2-what-the-demo-does)
3. [How it works: the algorithms](#3-how-it-works-the-algorithms)
4. [The syllabus](#4-the-syllabus)
5. [Video lessons](#5-video-lessons)
6. [Repository layout](#6-repository-layout)
7. [Run, build and test](#7-run-build-and-test)
8. [Planned full-stack architecture](#8-planned-full-stack-architecture)
9. [Known limitations](#9-known-limitations)
10. [Roadmap](#10-roadmap)
11. [Content and sources](#11-content-and-sources)

---

## 1. Project status at a glance

| Area | State |
|---|---|
| Learner-model engine (BKT, forgetting) | Done, unit-tested (Python) |
| Spaced-repetition scheduler (SM-2 style) | Done, unit-tested (Python) |
| Adaptive difficulty and next-concept choice | Done, unit-tested (Python) |
| Reasoning-based misconception analyser (rule-based) with LLM-output validator | Done, unit-tested (Python) |
| Interactive single-file demo (student and teacher views) | Done; logic smoke-tested in Node, **not yet tested in a browser** |
| Syllabus tab with video lessons for all 12 concepts | Done (in-page animation, not an MP4); Hindi for Electric Charge only |
| Backend service layer: auth (scrypt, signed tokens), role-based access, answers, mastery, misconceptions, SRS, teacher heatmap, review queue, assignments | Done on **SQLite**, 23 tests, standard library only |
| FastAPI HTTP wrapper (`backend/app/main.py`) | Written, **never run** (FastAPI could not be installed in the development session; syntax-checked only) |
| PostgreSQL, SQLAlchemy, Alembic migrations | **Not started** (the service uses SQLite) |
| Claude API integration with validation and rule fallback | Code and tests done against a **fake provider**; **never called a real model** |
| Evaluation of misconception detection and mastery model | Done, see [3.5](#35-evidence-what-was-measured) |
| JS/Python parity tests, CI workflow | Done (CI workflow written, not yet seen running on GitHub) |
| React + TypeScript + Tailwind + React Flow frontend | **Not started** (the demo is vanilla JS) |
| Frontend component tests | **Not started** |

The demo is a self-contained showcase of the learner-model ideas running in the browser. The production stack described in [section 8](#8-planned-full-stack-architecture) is a plan, not working code.

---

## 2. What the demo does

Open `index.html` (or the live link). Progress is saved in the browser's `localStorage`, so there is no account and nothing is sent anywhere. Use **Load demo student** on the Dashboard (it keeps your roll number) for a student with history (23 simulated answers run through the real engine, so every screen has data), or **Reset my demo data** to start over.

### Student view

| Tab | What it provides |
|---|---|
| **Dashboard** | Overall mastery, concepts mastered / weak, questions attempted, accuracy trend, time spent answering, learning streak, today's plan (revisions due, recommended next concept, open misconceptions), recent activity. Every number is computed from your own answers. |
| **Syllabus** | Course-style cards for the 12 concepts with mastery bars, filters (All, Video lessons, Weak, Not started) and a calendar showing days with revisions due. Electric Charge opens a video lesson. |
| **Concept graph** | Interactive prerequisite graph. Node colour follows your mastery (green mastered, yellow developing, red weak, grey not assessed, blue ring for the concept you are currently practising). Click a node for the explanation, prerequisites, your recent performance, detected misconceptions and a "Practise" button. |
| **Practice** | Adaptive questions with an answer box and a **reasoning** box. After submitting you see the explanation, an evaluation of your reasoning, any possible misconception (with a confidence score and a suggested fix), the change in mastery, and an offline tutor. After a detected misconception the next question targets it. |
| **Revision** | A 14-day strip, a list of due / overdue / upcoming concepts, and a **demo clock** (+1 day, +7 days) so you can watch revisions fall due and mastery decay. |
| **Diagnostic** | One question per concept (12 in total) followed by a report: strong, developing and weak concepts, possible misconceptions, recommended starting difficulty (1-5) and a suggested learning path. |

### Teacher view

| Tab | What it provides |
|---|---|
| **Class heatmap** | Roll numbers by concept, coloured green / yellow / red / grey, with class averages, the hardest concepts, students needing attention and assessment completion. |
| **Misconceptions** | Misconceptions ranked by how many students show them, with the concept, an example of reasoning and a recommended teaching intervention. |
| **Review queue** | Uncertain predictions (confidence under 80%) wait for a teacher to confirm or dismiss. Three labelled sample items show phrasings the rules cannot catch; your own uncertain predictions appear here too. |
| **Assignments** | Pick concepts, a difficulty and a deadline. Assignments are recorded locally only. |

> **The class is sample data.** Roll 101 to 106 on the heatmap are hand-written illustrative values; the interface no longer tags them as samples, so this note is the disclosure. Only the row for **your own roll number** (set on the Dashboard) reflects real activity from your own browser session.

---

## 3. How it works: the algorithms

The same logic exists twice: as tested Python in `backend/app/core/` and as a JavaScript port inside the demo. Business logic is deterministic. An AI model may only *suggest* (for example a misconception label); it never writes mastery or schedules directly.

### 3.1 Mastery: difficulty-aware Bayesian Knowledge Tracing (`bkt.py`)

Mastery `p` is a probability from 0 to 1 per student per concept (shown as 0-100). It starts at **0.30**.

For each evaluated answer at difficulty `d` (1-5):

1. **Difficulty-adjusted guess and slip.** Harder questions are harder to guess and slips are less likely:
   `guess = 0.20 × (1.25 − 0.125 × (d−1))` (0.25 down to 0.125) and
   `slip = 0.10 × (1.4 − 0.2 × (d−1))` (0.14 down to 0.06).
2. **Bayesian posterior.**
   Correct: `p(1−slip) / (p(1−slip) + (1−p)·guess)`.
   Incorrect: `p·slip / (p·slip + (1−p)(1−guess))`.
3. **Evidence weight.** `w = reasoning_quality × novelty`, each in [0, 1]. A correct answer with weak reasoning moves mastery less. A repeat of a recently seen question is discounted (`novelty = 0.5`), because it shows recall, not understanding. A wrong answer always has weight of at least 0.35, so it is never ignored.
4. **Shrink toward the prior.** `p' = p + w × (posterior − p)`.
5. **Learning step, only after a correct answer.** `p'' = p' + (1 − p') × 0.15 × novelty`. A wrong answer never raises mastery. (This was a real bug found in testing and is now covered by a test.)
6. **Cap.** Mastery is capped at 0.98, so the model never claims certainty.
7. **Confidence** in the estimate is `1 − e^(−attempts/3)`: it grows with evidence.

**Forgetting.** Current mastery decays toward the 0.30 prior with a 30-day half-life, based on the time since the concept was last practised.

**Bands.** 0.80 and above is *mastered*; 0.50 to 0.79 is *developing*; below 0.50 is *weak*; no attempts is *not assessed*.

### 3.2 Adaptive difficulty and what to study next (`adaptive.py`)

- **Target difficulty** = `1 + floor(p × 4.999)`. One level easier after two misses in a row; one level harder after three correct in a row. Clamped to 1-5.
- **Next concept** = the weakest concept whose prerequisites are all at least 0.50 mastery. Unassessed concepts count as 0.30 so foundations are assessed first.
- **Question choice (demo).** Prefer a question that targets an open misconception on that concept; otherwise the question closest to the target difficulty that was not asked recently.

### 3.3 Spaced repetition (`srs.py`)

An SM-2-inspired scheduler.

- Each review has a quality in [0, 1]. In the demo it is `0.6 × correct + 0.4 × reasoning_quality`.
- **Failed review** (quality below 0.6): the ladder resets and the concept returns in 1 day.
- **Successful review:** the base ladder is **1, 3, 7, 14, 30 days**, scaled by the ease factor (`ease / 2.3`, with ease kept at 1.3 or more). Beyond the fifth review the interval multiplies by ease.
- **Harder concepts return sooner** (`interval × (1 − 0.05 × (difficulty − 3))`).
- **An unresolved misconception caps the interval at 3 days.**
- Status is *overdue* (a day or more late), *due*, or *upcoming*.

### 3.4 Reasoning-based misconception detection (`misconception.py`)

The student is asked to explain their reasoning. The analyser returns a **prediction with a confidence score**, never a certainty, so a teacher can review uncertain cases.

Categories: `conceptual_misunderstanding`, `calculation_error`, `wrong_formula`, `incomplete_reasoning`, `right_answer_wrong_reasoning`, `insufficient_evidence`, `none`.

- **Pattern rules** match typical wrong explanations. Example: "current increases because resistance blocks the voltage" is flagged as *believes current rises when resistance rises* (confidence 0.85 when the answer is wrong).
- **Option-linked tags.** In multiple-choice and numeric questions, specific wrong options (or wrong values such as adding parallel resistors to get 9 Ω) map to a misconception tag (confidence 0.75).
- **Thin evidence is labelled as such.** Fewer than four words of reasoning gives `insufficient_evidence` with low confidence.
- **`validate_analysis`** checks any LLM-produced analysis (allowed category, confidence and quality in [0, 1], allowed severity) before it can be used. Invalid output raises an error.

The demo knows nine misconception tags: resistance/current direction, current "used up", adding parallel resistances, current splitting in series, wrong power relation, longer wire means lower resistance, potential difference confused with current, reversed conventional current, and heat proportional to current instead of current squared.

When a misconception is detected it is recorded (with the student's own reasoning), the next question targets it, and the concept's revision interval is shortened. Two consecutive correct answers with no misconception resolve it.

### 3.5 Evidence: what was measured

Everything here is reproducible. Nothing was tuned on the holdout set.

**Misconception detection** (`python backend/eval/evaluate_misconceptions.py`). 90 invented student explanations, hand-labelled with the misconception they show (or none). A prediction is correct only if the tag matches exactly.

| Set | Role | Precision | Recall | F1 |
|---|---|---|---|---|
| Dev (30) | rules were written from these | 1.00 | 1.00 | 1.00 |
| Test (30) | written before tuning, **but its misses were seen**, so treat as contaminated | 1.00 | 0.95 | 0.97 |
| **Holdout (30)** | written after tuning, informal phrasing and typos, never used to tune | **1.00** | **0.50** | **0.67** |

Reading: the rules almost never flag a misconception wrongly (no false positives on any set, including correct explanations that share keywords), but they **miss about half of unfamiliar phrasings** (for example "the lamp takes some current away"). The first, untuned version scored recall 0.55 on dev and 0.20 on test. This gap is the case for the AI layer. The holdout set is small, the rows are invented rather than collected from students, and the figure should be read as a rough guide only.

**The AI layer is not yet measured.** `python backend/eval/evaluate_misconceptions.py --provider anthropic` (needs `ANTHROPIC_API_KEY`) runs the same sets through the rules-then-model pipeline. It has not been run, so no figure is claimed.

**Mastery model vs percent-correct** (`python backend/eval/simulate_mastery.py`, chart in `backend/eval/mastery_simulation.svg`). 4,000 simulated students per world, each with a hidden "knows / doesn't know" state per concept. Accuracy is how often "mastery ≥ 0.5" (BKT) or "percent correct > 0.5" matches the hidden state; Brier score measures probability quality (lower is better).

| World | After | Accuracy: BKT / % correct | Brier: BKT / % correct |
|---|---|---|---|
| Knowledge fixed, model assumptions correct | 3 answers | 0.936 / 0.934 | 0.051 / 0.068 |
| | 10 answers | 0.975 / **0.995** | **0.018** / 0.039 |
| Knowledge fixed, model assumptions wrong | 10 answers | 0.909 / **0.960** | **0.064** / 0.082 |
| Students learn while practising | 5 answers | 0.872 / 0.858 | 0.104 / 0.110 |
| | 10 answers | **0.940** / 0.858 | **0.049** / 0.094 |

Reading: BKT gives **better-calibrated probabilities** in every world at 10 answers, and clearly better tracking when students are *learning*, which is the realistic case. When knowledge is fixed, simple percent-correct classifies as well or slightly better after many answers, because BKT's learning step keeps nudging estimates upward. The simulation does not exercise BKT's other features (difficulty, reasoning quality, forgetting), and simulated students are not real ones.

**JS/Python parity** (`node demo/parity.test.js`). The demo's JavaScript is checked against the Python engine on 450 generated vectors (mastery, scheduling, difficulty and misconception tags). The misconception rules live in one file, `backend/app/core/rules_data.py`, and `demo/build.py` injects them into the page.

---

## 4. The syllabus

**Class 10 Physics: Electricity.** Twelve concepts, each with a description, difficulty (1-5), prerequisites and learning objectives.

```
Electric Charge ─► Electric Current ─┬─► Electric Circuit
                                     ├─► Potential Difference ─► Ohm's Law ─► Resistance ─┬─► Factors Affecting Resistance
                                     │                                                    ├─► Series Combination
                                     │                                                    └─► Parallel Combination
                                     └─► Heating Effect ─► Electric Power ─► Electrical Energy
```

**Question bank:** 39 questions (multiple choice, numeric and short answer) across all 12 concepts and difficulties 1-5. Each has an expected answer and an explanation; many wrong options are linked to a misconception tag.

---

## 5. Video lessons

Every one of the 12 concepts has an animated, interactive lesson under **Syllabus** (`demo/src/lesson.js` for Electric Charge, `demo/src/lessons2.js` for the rest), drawn in the page on a canvas, not a rendered MP4 file. Each has checkpoint questions that feed the learner model. The walk-through below describes **Electric Charge**, the first and most developed lesson. Ohm’s Law also has a small voltage/resistance lab.

| Scene | Topic |
|---|---|
| 1 | A rubbed balloon sticks to a wall (electrons transfer) |
| 2 | Atoms: protons (+), electrons (−), neutrons |
| 3 | Like charges repel, unlike charges attract |
| 4 | Charge is transferred and conserved (glass rod and silk) |
| 5 | The coulomb, `e = 1.6 × 10⁻¹⁹ C`, `Q = n e` |
| 6 | Conductors and insulators |
| 7 | From charge to current, `I = Q / t` |
| 8 | Recap |

About two minutes in total. Controls: play / pause, restart, seek bar, 0.75× / 1× / 1.5× speed, captions on or off, **English or Hindi captions and narration** (on-screen diagram labels stay English), optional spoken narration (uses the browser's speech feature, which some viewers do not support). **Hindi captions and narration exist only for Electric Charge**; the language picker is hidden on the other lessons, and a scene list for jumping around.

**Three checkpoints** pause the video and ask a question. Your answers go through the same learner model as practice questions, so watching the lesson changes your mastery and revision schedule.

**Charge lab.** Below the video, flip the sign of each of two charges, change their sizes and the distance, and watch the force arrows and the relative force. The distance rule is Coulomb's law, a step beyond the Class 10 syllabus, and is labelled that way.

---

## 6. Repository layout

```
.
├── index.html                 Built single-file demo (served by GitHub Pages)
├── docs/index.html            Identical copy (so Pages can also serve /docs)
├── demo/
│   ├── index.src.html         Demo source: styles, engine port, views, questions
│   ├── src/lesson.js          Syllabus tab, lesson player, Electric Charge lesson, Hindi captions
│   ├── src/lessons2.js        Lessons for the other 11 concepts
│   ├── src/lesson.css         Styles for the above
│   ├── build.py               Bundles the source into index.html (+ docs/, root)
│   └── index.html             Built output
├── backend/
│   ├── app/core/
│   │   ├── bkt.py             Mastery model (BKT, decay, bands)
│   │   ├── srs.py             Revision scheduler
│   │   ├── adaptive.py        Difficulty and next-concept selection
│   │   ├── rules_data.py      Misconception rules (single source for Python and the demo)
│   │   ├── misconception.py   Rule-based analyser and LLM-output validator
│   │   └── llm.py             Claude provider, prompt, validation, rules-first hybrid
│   ├── app/service.py         Auth, authorization, answers, mastery, teacher analytics (SQLite)
│   ├── app/main.py            FastAPI wrapper (never run; see status)
│   ├── app/data/syllabus.json Concepts and questions (exported from the demo by demo/export_syllabus.js)
│   ├── eval/                  Labelled data, evaluators, simulation, results
│   ├── tests/                 test_core.py (18), test_service.py (23), parity vectors
│   ├── requirements.txt, .env.example
├── .github/workflows/ci.yml   Python tests, build check, parity, evaluation
├── LICENSE                    MIT
└── .nojekyll                  Tells GitHub Pages to serve files as they are
```

---

## 7. Run, build and test

**Open the demo.** Visit the live link, or open `index.html` in a browser. No server or install is needed. (The page loads two fonts from Google Fonts and falls back to system fonts offline.)

**Rebuild the demo after editing the source.**

```bash
python demo/build.py
```

This regenerates `demo/index.html`, `docs/index.html` and the root `index.html` from `demo/index.src.html` and `demo/src/`. Edit the source files, never the built copies.

**Run the Python tests.** The engine uses only the standard library plus `pytest`.

```bash
cd backend
python -m pytest -q
```

Expected: `41 passed` (18 engine tests, 23 service tests). The service tests cover registration and login, password hashing, token tampering and expiry, no answer key in questions, mastery and revision updates through the database, misconception recording and resolution, **teacher access limited to their own class**, review queue decisions, assignment validation, the LLM path with a fake provider (including five kinds of invalid model output), and the demo seed. The engine tests cover: correct answers raising and wrong answers lowering mastery, harder questions counting as stronger evidence, weak reasoning damping a correct answer, a wrong answer never raising mastery, repeated questions being weaker evidence, the 0.98 cap, confidence growth, forgetting, mastery bands, the revision ladder and reset, the misconception interval cap, the difficulty rules, prerequisite-aware concept choice, the example misconception, and rejection of invalid LLM output.

**Other checks.**

```bash
node demo/parity.test.js                          # JS port vs Python engine
python backend/eval/evaluate_misconceptions.py    # precision / recall
python backend/eval/simulate_mastery.py           # BKT vs percent-correct
node demo/export_syllabus.js                      # refresh backend/app/data/syllabus.json
```

**Run the API (not yet verified).** `pip install -r backend/requirements.txt`, copy `backend/.env.example` to `backend/.env`, then `uvicorn app.main:app --app-dir backend --reload`. Set `DEMO_MODE=1` and call `POST /api/demo/seed` for a sample class (teacher@demo.example / demo-password; all sample records are flagged `is_sample`). Without `ANTHROPIC_API_KEY` the rule-based analyser is used.

**Publish with GitHub Pages.** Repository **Settings → Pages**, source **Deploy from a branch**, branch `main`, folder `/ (root)` (or `/docs`).

---

## 8. Planned full-stack architecture

> **Partly implemented.** The service layer (SQLite), authentication, role checks and the LLM provider layer exist and are tested; the FastAPI wrapper is untested; PostgreSQL, SQLAlchemy, Alembic and the React frontend are still plans.

**Stack.** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, React Flow and Framer Motion on the front end. FastAPI, Pydantic, SQLAlchemy and Alembic on the back end, with PostgreSQL. Claude API (or another configurable provider) behind the backend only, with the rule-based fallback kept for use without an API key. API keys are never exposed to the browser.

**Roles.** Student, teacher and administrator, with password hashing, JWT or session authentication, role-based access and teacher access limited to their own classes.

**AI services** (each returns validated JSON; the AI never writes to the database directly): QuestionGenerator, AnswerEvaluator, ReasoningAnalyzer, MisconceptionDetector, ExplanationGenerator, LearningPathRecommender, AdaptiveDifficultyEngine.

**Database tables:** users, students, teachers, classes, class_students, subjects, syllabuses, concepts, concept_prerequisites, questions, question_concepts, assessments, assessment_questions, student_answers, learner_mastery, mastery_history, misconceptions, revision_schedule, revision_history, assignments, assignment_submissions, ai_generation_logs.

**Planned API groups:** `/api/auth` (register, login, me), `/api/student` (dashboard, mastery, learning path, revision schedule), `/api/diagnostic`, `/api/concepts` (list, graph, detail), `/api/questions` (generate, evaluate, recommended), `/api/misconceptions` (list, detail, resolve), `/api/revision` (due, complete), `/api/teacher` (dashboard, classes, class analytics and heatmap, student detail, assignments).

The Python engine in `backend/app/core/` is written to drop into this backend unchanged.

---

## 9. Known limitations

- **The web demo has no accounts or database.** It stores progress in the browser only. The tested service layer provides accounts and a database but is not connected to the demo page.
- **No administrator role** and no real teacher accounts. The teacher view uses a fixed sample class plus your own row.
- **No AI model has been called.** The Claude integration is tested only against a fake provider. In the demo, detection, feedback and the tutor are rule-based, and the tutor answers from the syllabus notes and your history, not open-ended questions.
- **Rule-based detection misses about half of unfamiliar phrasings** (holdout recall 0.50, precision 1.00, on 30 invented rows). Predictions carry a confidence score and uncertain ones go to the review queue.
- **Not browser-tested.** The demo's logic and every view's rendering were exercised in Node with a stubbed page, but layout, the graph and the animations have not been checked across real browsers and screen sizes.
- **No interface tests.** The JavaScript engine is parity-tested against Python, but the screens themselves have no automated tests.
- **Evaluation data is invented**, not collected from real students, and small (30 rows per set).
- **The service layer uses SQLite**, not PostgreSQL, and has not been load-tested.
- **CI has not been observed running** on GitHub yet.
- **The "video" is an animation in the page**, not a downloadable video file, and spoken narration depends on the viewer's browser.
- **Assignments are not delivered** to students in the demo.
- **One syllabus.** Only Class 10 Electricity exists. All 12 concepts have a lesson, but only Electric Charge has Hindi narration, and the quality of the later lessons has not been reviewed against a textbook.

---

## 10. Roadmap

- [x] Learner-model engine with tests
- [x] Spaced-repetition scheduler with tests
- [x] Misconception analyser with output validation
- [x] Interactive demo (student and teacher views)
- [x] Syllabus tab and Electric Charge video lesson
- [ ] Browser testing across devices; fix layout issues found
- [x] JS/Python parity tests; CI workflow
- [x] Service layer with authentication, role-based access and teacher authorization (SQLite)
- [x] Misconception evaluation and mastery simulation
- [ ] Run and test the FastAPI wrapper; connect the demo page to the API
- [ ] PostgreSQL schema with Alembic migrations
- [ ] Run the evaluator against a real model and publish the hybrid numbers
- [ ] Collect real (consented) student explanations to replace the invented evaluation set
- [ ] LLM question generation with validation
- [ ] React + TypeScript frontend with React Flow concept graph
- [ ] Teacher assignments with student delivery and completion tracking
- [x] Video lessons for all 12 concepts
- [ ] Hindi (and other languages) for the remaining lessons
- [ ] Administrator tools: users, syllabuses, question bank, provider settings
- [ ] Continuous integration and deployment

---

## 11. Content and sources

The syllabus is aligned to the Electricity chapter of **NCERT Class 10 Science** (Chapter 11 in the current edition, Chapter 12 in earlier ones). All narration, questions, explanations and diagrams in this repository are original and paraphrased; no textbook text is reproduced. Please check the content against your own textbook before relying on it for teaching.

Worked solutions for that chapter, for further reading:
[Careers360](https://school.careers360.com/ncert/ncert-solutions-class-10-science-chapter-12-electricity) ·
[Vedantu](https://vedantu.com/ncert-solutions/ncert-solutions-class-10-science-chapter-12-electricity)


---

## Update: all-concept video lessons, roll numbers, new UI, OpenAI tutor

- **Video lessons:** all 12 concepts now have an animated in-page lesson with checkpoint questions (`demo/src/lessons2.js`). They are canvas animations, not MP4 files. Ohm's Law also has a small lab.
- **Roll numbers:** the teacher heatmap shows roll numbers (Roll 101 to 106 are sample data). Students set their own on the Dashboard.
- **Look:** the dark midnight-black and cobalt theme (restored after a light-theme trial) with responsive layouts for phone, laptop and desktop.
- **AI tutor:** the page has no API key and no key field. A key in a public static page would be exposed to everyone, so AI answers need a small backend proxy that holds the key. The tutor currently answers from the syllabus notes.

## Landing page (cinematic UI)

The site now opens on a landing screen: a generative canvas hero that draws the electric field lines of a + and a − charge (the − charge follows your pointer), glass cards, pill buttons and a live teacher-heatmap preview. It pauses when off-screen and respects `prefers-reduced-motion`. Click **Open the app** or any feature to enter the app; the brand link returns home. Routing is hash-based (`#home`, `#app`).

Source: `demo/src/landing.js` and `demo/src/landing.css`, injected by `demo/build.py`. The class and heatmap shown are sample data. The hero is drawn in code, so it needs no video or image files.
