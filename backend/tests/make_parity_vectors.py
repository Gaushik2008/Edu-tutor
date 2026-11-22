"""Generate reference vectors from the Python engine; demo/parity.test.js checks the JS port against them.
Run:  python backend/tests/make_parity_vectors.py"""
import json, random, sys
from datetime import datetime, timedelta
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core import adaptive, bkt, misconception, srs
from eval.dataset import DEV, TEST, HOLDOUT

rnd = random.Random(1)
v = {"bkt": [], "srs": [], "difficulty": [], "misconception": []}
for _ in range(200):
    st = bkt.MasteryState(rnd.random() * 0.96 + 0.02, rnd.randint(0, 8), 0, 0)
    a = dict(ok=rnd.random() < 0.5, d=rnd.randint(1, 5), rq=round(rnd.random(), 2), nov=rnd.choice([1.0, 0.5]))
    n = bkt.update(st, a["ok"], a["d"], a["rq"], a["nov"])
    v["bkt"].append(dict(p=st.p_mastery, att=st.attempts, **a, out=n.p_mastery, conf=n.confidence))
now = datetime(2026, 1, 1)
for _ in range(100):
    r = srs.ReviewState(rnd.randint(0, 6), round(1.3 + rnd.random() * 1.5, 2), rnd.choice([0, 1, 3, 7, 14, 30]))
    q, d, mo = round(rnd.random(), 2), rnd.randint(1, 5), rnd.random() < 0.3
    ns, due = srs.schedule(r, q, now, d, mo)
    v["srs"].append(dict(reps=r.repetitions, ease=r.ease, interval=r.interval_days, q=q, d=d, mo=mo,
                         out_reps=ns.repetitions, out_ease=ns.ease, out_interval=ns.interval_days,
                         out_days=(due - now).total_seconds() / 86400))
for _ in range(60):
    p = round(rnd.random(), 2); rec = [rnd.random() < 0.5 for _ in range(rnd.randint(0, 5))]
    v["difficulty"].append(dict(p=p, recent=rec, out=adaptive.target_difficulty(p, rec)))
for c, ok, t, _ in DEV + TEST + HOLDOUT:
    a = misconception.analyse(c, ok, t)
    v["misconception"].append(dict(c=c, ok=ok, t=t, tag=a.tags[0] if a.tags else None, rq=a.reasoning_quality))
Path(__file__).with_name("parity_vectors.json").write_text(json.dumps(v))
print({k: len(x) for k, x in v.items()})
