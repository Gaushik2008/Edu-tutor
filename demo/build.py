"""Bundle demo/index.src.html + src/lesson.{js,css} into the single-file demo/index.html."""
from pathlib import Path
d = Path(__file__).parent
s = (d / "index.src.html").read_text()
s = s.replace("/*@@LESSON_CSS@@*/", (d / "src/lesson.css").read_text())
s = s.replace("/*@@LESSON_JS@@*/", (d / "src/lesson.js").read_text())
(d / "index.html").write_text(s)
print("built", len(s), "bytes")
