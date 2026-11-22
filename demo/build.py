"""Bundle demo/index.src.html + src/lesson.{js,css} into the single-file demo/index.html."""
from pathlib import Path
d = Path(__file__).parent
import json, sys
sys.path.insert(0, str(d.parent / "backend"))
from app.core.rules_data import RULES
s = (d / "index.src.html").read_text()
s = s.replace("/*@@MIS@@*/{}", json.dumps({r["tag"]: {"c": r["concept"], "label": r["label"], "fix": r["fix"]} for r in RULES}, ensure_ascii=False))
s = s.replace("/*@@RULES@@*/[]", json.dumps(RULES, ensure_ascii=False))
s = s.replace("/*@@LESSON_CSS@@*/", (d / "src/lesson.css").read_text())
s = s.replace("/*@@LESSON_JS@@*/", (d / "src/lesson.js").read_text())
(d / "index.html").write_text(s)
(d.parent / "docs").mkdir(exist_ok=True)
(d.parent / "docs" / "index.html").write_text(s)
(d.parent / "index.html").write_text(s)  # root copy: Pages serving the repo root
print("built", len(s), "bytes")
