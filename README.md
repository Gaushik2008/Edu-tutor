# AdaptiveLearn AI (`edu-tutor`)

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
5. [Electric Charge video lesson](#5-electric-charge-video-lesson)
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
| Syllabus tab and Electric Charge video lesson | Done (in-page animation, not an MP4) |
| FastAPI backend, PostgreSQL, authentication | **Not started** |
| LLM provider integration (Claude API) | **Not started** (rule-based fallback only) |
| React + TypeScript + Tailwind + React Flow frontend | **Not started** (the demo is vanilla JS) |
| JavaScript tests, frontend tests, CI | **Not started** |

The demo is a self-contained showcase of the learner-model ideas running in the browser. The production stack described in [section 8](#8-planned-full-stack-architecture) is a plan, not working code.

---

## 2. What the demo does

Open `index.html` (or the live link). Progress is saved in the browser's `localStorage`, so there is no account and nothing is sent anywhere. Use **Reset my demo data** on the Dashboard to start over.

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
| **Class heatmap** | Students by concept, coloured green / yellow / red / grey, with class averages, the hardest concepts, students needing attention and assessment completion. |
| **Misconceptions** | Misconceptions ranked by how many students show them, with the concept, an example of reasoning and a recommended teaching intervention. |
| **Assignments** | Pick concepts, a difficulty and a deadline. Assignments are recorded locally only. |

> **The class is sample data.** Six heatmap rows ("Sample student A" to "F") are hand-written illustrative values, labelled as samples. Only the row named **You (live)** reflects real activity from your own browser session.

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

## 5. Electric Charge video lesson

Found under **Syllabus → Electric Charge**. It is an animated, interactive lesson drawn in the page (canvas), not a rendered MP4 file.

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

About two minutes in total. Controls: play / pause, restart, seek bar, 0.75× / 1× / 1.5× speed, captions on or off, optional spoken narration (uses the browser's speech feature, which some viewers do not support), and a scene list for jumping around.

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
│   ├── src/lesson.js          Syllabus tab and video lesson player
│   ├── src/lesson.css         Styles for the above
│   ├── build.py               Bundles the source into index.html (+ docs/, root)
│   └── index.html             Built output
├── backend/
│   ├── app/core/
│   │   ├── bkt.py             Mastery model (BKT, decay, bands)
│   │   ├── srs.py             Revision scheduler
│   │   ├── adaptive.py        Difficulty and next-concept selection
│   │   └── misconception.py   Reasoning analyser and LLM-output validator
│   └── tests/test_core.py     18 unit tests
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

Expected: `18 passed`. The tests cover: correct answers raising and wrong answers lowering mastery, harder questions counting as stronger evidence, weak reasoning damping a correct answer, a wrong answer never raising mastery, repeated questions being weaker evidence, the 0.98 cap, confidence growth, forgetting, mastery bands, the revision ladder and reset, the misconception interval cap, the difficulty rules, prerequisite-aware concept choice, the example misconception, and rejection of invalid LLM output.

**Publish with GitHub Pages.** Repository **Settings → Pages**, source **Deploy from a branch**, branch `main`, folder `/ (root)` (or `/docs`).

---

## 8. Planned full-stack architecture

> **This section is a plan. None of it is implemented yet.**

**Stack.** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, React Flow and Framer Motion on the front end. FastAPI, Pydantic, SQLAlchemy and Alembic on the back end, with PostgreSQL. Claude API (or another configurable provider) behind the backend only, with the rule-based fallback kept for use without an API key. API keys are never exposed to the browser.

**Roles.** Student, teacher and administrator, with password hashing, JWT or session authentication, role-based access and teacher access limited to their own classes.

**AI services** (each returns validated JSON; the AI never writes to the database directly): QuestionGenerator, AnswerEvaluator, ReasoningAnalyzer, MisconceptionDetector, ExplanationGenerator, LearningPathRecommender, AdaptiveDifficultyEngine.

**Database tables:** users, students, teachers, classes, class_students, subjects, syllabuses, concepts, concept_prerequisites, questions, question_concepts, assessments, assessment_questions, student_answers, learner_mastery, mastery_history, misconceptions, revision_schedule, revision_history, assignments, assignment_submissions, ai_generation_logs.

**Planned API groups:** `/api/auth` (register, login, me), `/api/student` (dashboard, mastery, learning path, revision schedule), `/api/diagnostic`, `/api/concepts` (list, graph, detail), `/api/questions` (generate, evaluate, recommended), `/api/misconceptions` (list, detail, resolve), `/api/revision` (due, complete), `/api/teacher` (dashboard, classes, class analytics and heatmap, student detail, assignments).

The Python engine in `backend/app/core/` is written to drop into this backend unchanged.

---

## 9. Known limitations

- **No accounts, no database.** The demo stores progress in the browser only. Clearing site data erases it, and it is not shared between devices.
- **No administrator role** and no real teacher accounts. The teacher view uses a fixed sample class plus your own row.
- **No AI model is connected.** Misconception detection, feedback and the tutor are rule-based. The tutor answers from the syllabus notes and your history, not open-ended questions.
- **Rule-based detection is narrow.** It recognises the specific patterns listed above and will miss others. Predictions carry a confidence score and should be reviewed.
- **Not browser-tested.** The demo's logic and every view's rendering were exercised in Node with a stubbed page, but layout, the graph and the animations have not been checked across real browsers and screen sizes.
- **Tests cover the Python engine only.** The JavaScript port and the interface have no committed tests, so the two implementations could drift apart.
- **The "video" is an animation in the page**, not a downloadable video file, and spoken narration depends on the viewer's browser.
- **Assignments are not delivered** to students in the demo.
- **One syllabus and one lesson.** Only Class 10 Electricity exists, and only Electric Charge has a video.
- **No licence has been chosen yet.**

---

## 10. Roadmap

- [x] Learner-model engine with tests
- [x] Spaced-repetition scheduler with tests
- [x] Misconception analyser with output validation
- [x] Interactive demo (student and teacher views)
- [x] Syllabus tab and Electric Charge video lesson
- [ ] Browser testing across devices; fix layout issues found
- [ ] JavaScript tests for the demo engine; keep it in step with the Python engine
- [ ] FastAPI backend and PostgreSQL schema with migrations
- [ ] Authentication and role-based access
- [ ] Claude API integration for question generation and reasoning analysis, with the fallback retained
- [ ] React + TypeScript frontend with React Flow concept graph
- [ ] Teacher assignments with student delivery and completion tracking
- [ ] More video lessons (one per concept)
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
- **New look:** light "paper and teal" theme with a left sidebar on desktop.
- **OpenAI tutor:** paste your own API key on the Dashboard. It is stored only in your browser's localStorage and sent only to api.openai.com. Never commit a key; this is a public static page, so anything embedded in it would be exposed.
