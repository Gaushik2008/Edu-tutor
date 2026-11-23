"""Measure misconception-detection precision/recall on the labelled set.

Run:  python backend/eval/evaluate_misconceptions.py
A prediction counts as a true positive only if the predicted tag equals the
labelled tag. Predicting a wrong tag counts as both a false positive and a miss.
"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core import misconception
from eval.dataset import DEV, TEST, HOLDOUT

PROVIDER = None


def predict(concept, ok, text):
    if PROVIDER is not None:
        from app.core.llm import hybrid_analyse
        a = hybrid_analyse(concept, ok, text, PROVIDER)
    else:
        a = misconception.analyse(concept, ok, text)
    return a.tags[0] if a.tags else None

def score(rows):
    tp = fp = fn = tn = 0
    misses = []
    for concept, ok, text, truth in rows:
        pred = predict(concept, ok, text)
        if truth and pred == truth: tp += 1
        elif truth and pred is None: fn += 1; misses.append((text, truth, pred))
        elif truth and pred != truth: fp += 1; fn += 1; misses.append((text, truth, pred))
        elif not truth and pred: fp += 1; misses.append((text, truth, pred))
        else: tn += 1
    p = tp / (tp + fp) if tp + fp else 0.0
    r = tp / (tp + fn) if tp + fn else 0.0
    f = 2 * p * r / (p + r) if p + r else 0.0
    return dict(n=len(rows), tp=tp, fp=fp, fn=fn, tn=tn, precision=round(p, 3), recall=round(r, 3), f1=round(f, 3)), misses

if __name__ == "__main__":
    out = {}
    global_provider = None
    if "--provider" in sys.argv:  # python evaluate_misconceptions.py --provider anthropic  (needs ANTHROPIC_API_KEY)
        from app.core.llm import AnthropicProvider
        PROVIDER = AnthropicProvider()  # noqa: module-level rebind below
        assert PROVIDER.available, "set ANTHROPIC_API_KEY"
    tag = "hybrid" if PROVIDER else "rules"
    for name, rows in (("dev", DEV), ("test", TEST), ("holdout", HOLDOUT)):
        out[name], misses = score(rows)
        print(f"{name:7} n={out[name]['n']:2} P={out[name]['precision']:.2f} R={out[name]['recall']:.2f} F1={out[name]['f1']:.2f}  (TP {out[name]['tp']} FP {out[name]['fp']} FN {out[name]['fn']})")
        if name == "holdout":
            for m in misses: print("   miss:", m)
    Path(__file__).with_name(f"results_misconceptions_{tag}.json").write_text(json.dumps(out, indent=2))
