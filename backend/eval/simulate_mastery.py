"""Does BKT estimate hidden understanding better than plain percent-correct?

Simulated students each have a hidden state per concept (knows / doesn't). Answers are
drawn from that state. After n answers we classify "knows" and compare with the truth.
Two worlds: MATCHED (generator uses the model's own guess/slip, so BKT has an advantage)
and MISMATCHED (guess 0.30, slip 0.20 for everyone, so the model's assumptions are wrong).
Stdlib only, fixed seed.  Run: python backend/eval/simulate_mastery.py
"""
import json, random, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core import bkt

N_STUDENTS, MAXQ = 4000, 10

def world(kind, seed):
    matched = kind != 'mismatched'
    learning = kind == 'learning'
    rnd = random.Random(seed)
    acc = {m: [0] * MAXQ for m in ("bkt", "pct")}
    brier = {m: [0.0] * MAXQ for m in ("bkt", "pct")}
    for _ in range(N_STUDENTS):
        knows = rnd.random() < 0.5
        st = bkt.MasteryState()
        c = 0
        for n in range(1, MAXQ + 1):
            d = rnd.randint(1, 5)
            g, s = bkt.difficulty_adjusted(d) if matched else (0.30, 0.20)
            ok = rnd.random() < ((1 - s) if knows else g)
            if learning and not knows and rnd.random() < bkt.P_LEARN:
                knows = True  # the student learns while practising (after this answer)
            st = bkt.update(st, ok, d)
            c += ok
            truth = 1.0 if knows else 0.0
            pb, pp = st.p_mastery, c / n
            acc["bkt"][n - 1] += (pb >= 0.5) == knows
            acc["pct"][n - 1] += (pp > 0.5) == knows
            brier["bkt"][n - 1] += (pb - truth) ** 2
            brier["pct"][n - 1] += (pp - truth) ** 2
    return {m: {"accuracy": [round(a / N_STUDENTS, 3) for a in acc[m]],
                "brier": [round(b / N_STUDENTS, 3) for b in brier[m]]} for m in acc}

def svg(res):
    W, H, L, B = 760, 330, 56, 40
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="Inter,Arial,sans-serif" font-size="12">',
           f'<rect width="{W}" height="{H}" fill="#0D1019"/>']
    cols = {"bkt": "#4C86FF", "pct": "#8A93B2"}
    panels = [("matched", "Static knowledge", 0), ("mismatched", "Model assumptions wrong", 255), ("learning", "Students learn as they practise", 510)]
    for key, title, ox in panels:
        pw = 235
        out.append(f'<text x="{ox + pw / 2}" y="18" fill="#E9EDFB" text-anchor="middle" font-weight="600">{title}</text>')
        for yv in (0.5, 0.6, 0.7, 0.8, 0.9, 1.0):
            y = 30 + (H - 30 - B) * (1 - (yv - 0.5) / 0.5)
            out.append(f'<line x1="{ox + 30}" x2="{ox + pw}" y1="{y:.0f}" y2="{y:.0f}" stroke="#1A2036"/><text x="{ox + 24}" y="{y + 4:.0f}" fill="#8A93B2" text-anchor="end">{int(yv * 100)}%</text>')
        for m in ("pct", "bkt"):
            pts = " ".join(f"{ox + 30 + (n / (MAXQ - 1)) * (pw - 40):.1f},{30 + (H - 30 - B) * (1 - (a - 0.5) / 0.5):.1f}"
                           for n, a in enumerate(res[key][m]["accuracy"]))
            out.append(f'<polyline points="{pts}" fill="none" stroke="{cols[m]}" stroke-width="2.5"/>')
        for n in (1, 5, 10):
            out.append(f'<text x="{ox + 30 + ((n - 1) / (MAXQ - 1)) * (pw - 40):.0f}" y="{H - 22}" fill="#8A93B2" text-anchor="middle">{n}</text>')
        out.append(f'<text x="{ox + pw / 2}" y="{H - 6}" fill="#8A93B2" text-anchor="middle">questions answered</text>')
    out.append(f'<text x="{W - 20}" y="316" fill="{cols["bkt"]}" text-anchor="end">BKT (this project)</text><text x="{W - 20}" y="330" fill="{cols["pct"]}" text-anchor="end">Percent correct</text>')
    out.append('</svg>')
    return "\n".join(out)

if __name__ == "__main__":
    res = {"matched": world("matched", 7), "mismatched": world("mismatched", 8), "learning": world("learning", 9)}
    here = Path(__file__).parent
    (here / "results_simulation.json").write_text(json.dumps(res, indent=1))
    (here / "mastery_simulation.svg").write_text(svg(res))
    for k in res:
        print(k)
        for n in (1, 2, 3, 5, 10):
            print(f"  n={n:2}  accuracy  BKT {res[k]['bkt']['accuracy'][n-1]:.3f}  pct {res[k]['pct']['accuracy'][n-1]:.3f}   | Brier  BKT {res[k]['bkt']['brier'][n-1]:.3f}  pct {res[k]['pct']['brier'][n-1]:.3f}")
