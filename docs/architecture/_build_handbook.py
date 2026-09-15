# -*- coding: utf-8 -*-
"""Build docs/architecture/handbook.html from C4 + arc42 markdown (static HTML)."""
from pathlib import Path
import html as htmlmod
import re

root = Path(__file__).resolve().parent
out = root / "handbook.html"


def load(rel: str, prefix: str) -> str:
    text = (root / rel).read_text(encoding="utf-8")
    if prefix == "c4":
        text = re.sub(
            r"\]\((?!https?:|c4/)([^)]+\.(?:jpg|png|jpeg|gif))\)",
            r"](c4/\1)",
            text,
        )
        text = text.replace("](01-system-context.md)", "](#sec-c4-01)")
        text = text.replace("](02-container.md)", "](#sec-c4-02)")
        text = text.replace("](03-component.md)", "](#sec-c4-03)")
        text = text.replace("](04-code.md)", "](#sec-c4-04)")
        text = text.replace("](README.md)", "](#sec-c4-readme)")
    elif prefix == "arc42":
        text = text.replace("](diagrams/", "](arc42/diagrams/")
        text = text.replace("](../../", "](../")
        names = [
            ("01", "01-introduction-and-goals.md"),
            ("02", "02-architecture-constraints.md"),
            ("03", "03-context-and-scope.md"),
            ("04", "04-solution-strategy.md"),
            ("05", "05-building-block-view.md"),
            ("06", "06-runtime-view.md"),
            ("07", "07-deployment-view.md"),
            ("08", "08-crosscutting-concepts.md"),
            ("09", "09-architecture-decisions.md"),
            ("10", "10-quality-requirements.md"),
            ("11", "11-risks-and-technical-debt.md"),
            ("12", "12-glossary.md"),
        ]
        for i, name in names:
            text = text.replace(f"]({name})", f"](#sec-arc42-{i})")
        text = text.replace("](README.md)", "](#sec-arc42-readme)")
    return text


def inline(s: str) -> str:
    s = htmlmod.escape(s)
    s = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", r'<img alt="\1" src="\2" />', s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", s)
    return s


def is_table_sep(line: str) -> bool:
    t = line.strip().replace(" ", "")
    return bool(re.match(r"^\|?[:\-]+(\|[:\-]+)+\|?$", t))


def parse_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [c.strip() for c in line.split("|")]


def md_to_html(md: str) -> str:
    fences = []

    def fence_hold(m):
        lang = (m.group(1) or "").strip()
        body = m.group(2)
        fences.append((lang, body))
        return f"\n%%FENCE{len(fences) - 1}%%\n"

    md = re.sub(r"```(\w*)\n(.*?)```", fence_hold, md, flags=re.S)
    lines = md.splitlines()
    out_parts = []
    i = 0
    n = len(lines)

    def flush_para(buf):
        text = " ".join(buf).strip()
        if text:
            out_parts.append(f"<p>{inline(text)}</p>")
        buf.clear()

    para = []
    ul = []
    ol = []

    def flush_lists():
        if ul:
            out_parts.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in ul) + "</ul>")
            ul.clear()
        if ol:
            out_parts.append("<ol>" + "".join(f"<li>{inline(x)}</li>" for x in ol) + "</ol>")
            ol.clear()

    while i < n:
        line = lines[i]
        fence_m = re.match(r"^%%FENCE(\d+)%%$", line.strip())
        if fence_m:
            flush_para(para)
            flush_lists()
            lang, body = fences[int(fence_m.group(1))]
            if lang == "mermaid":
                out_parts.append(f'<pre class="mermaid">{htmlmod.escape(body.strip())}</pre>')
            else:
                out_parts.append(f"<pre><code>{htmlmod.escape(body.rstrip())}</code></pre>")
            i += 1
            continue
        if not line.strip():
            flush_para(para)
            flush_lists()
            i += 1
            continue
        hm = re.match(r"^(#{1,6})\s+(.*)$", line)
        if hm:
            flush_para(para)
            flush_lists()
            lvl = len(hm.group(1))
            out_parts.append(f"<h{lvl}>{inline(hm.group(2))}</h{lvl}>")
            i += 1
            continue
        if "|" in line and i + 1 < n and is_table_sep(lines[i + 1]):
            flush_para(para)
            flush_lists()
            headers = parse_row(line)
            i += 2
            rows = []
            while i < n and "|" in lines[i] and lines[i].strip() and not lines[i].strip().startswith("#"):
                rows.append(parse_row(lines[i]))
                i += 1
            thead = "".join(f"<th>{inline(h)}</th>" for h in headers)
            body_html = ""
            for row in rows:
                while len(row) < len(headers):
                    row.append("")
                body_html += "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in row[: len(headers)]) + "</tr>"
            out_parts.append(f"<table><thead><tr>{thead}</tr></thead><tbody>{body_html}</tbody></table>")
            continue
        um = re.match(r"^[-*]\s+(.*)$", line)
        if um:
            flush_para(para)
            if ol:
                flush_lists()
            ul.append(um.group(1))
            i += 1
            continue
        om = re.match(r"^\d+\.\s+(.*)$", line)
        if om:
            flush_para(para)
            if ul:
                flush_lists()
            ol.append(om.group(1))
            i += 1
            continue
        if line.strip().startswith(">"):
            flush_para(para)
            flush_lists()
            out_parts.append(f"<blockquote><p>{inline(line.strip()[1:].strip())}</p></blockquote>")
            i += 1
            continue
        para.append(line.strip())
        i += 1
    flush_para(para)
    flush_lists()
    return "\n".join(out_parts)


sections = [
    ("c4-readme", "C4 — README", load("c4/README.md", "c4")),
    ("c4-01", "C4 — 01 System Context", load("c4/01-system-context.md", "c4")),
    ("c4-02", "C4 — 02 Container", load("c4/02-container.md", "c4")),
    ("c4-03", "C4 — 03 Component", load("c4/03-component.md", "c4")),
    ("c4-04", "C4 — 04 Code", load("c4/04-code.md", "c4")),
    ("arc42-readme", "arc42 — README", load("arc42/README.md", "arc42")),
    ("arc42-01", "arc42 — 01 Introduction and Goals", load("arc42/01-introduction-and-goals.md", "arc42")),
    ("arc42-02", "arc42 — 02 Architecture Constraints", load("arc42/02-architecture-constraints.md", "arc42")),
    ("arc42-03", "arc42 — 03 Context and Scope", load("arc42/03-context-and-scope.md", "arc42")),
    ("arc42-04", "arc42 — 04 Solution Strategy", load("arc42/04-solution-strategy.md", "arc42")),
    ("arc42-05", "arc42 — 05 Building Block View", load("arc42/05-building-block-view.md", "arc42")),
    ("arc42-06", "arc42 — 06 Runtime View", load("arc42/06-runtime-view.md", "arc42")),
    ("arc42-07", "arc42 — 07 Deployment View", load("arc42/07-deployment-view.md", "arc42")),
    ("arc42-08", "arc42 — 08 Cross-cutting Concepts", load("arc42/08-crosscutting-concepts.md", "arc42")),
    ("arc42-09", "arc42 — 09 Architecture Decisions", load("arc42/09-architecture-decisions.md", "arc42")),
    ("arc42-10", "arc42 — 10 Quality Requirements", load("arc42/10-quality-requirements.md", "arc42")),
    ("arc42-11", "arc42 — 11 Risks and Technical Debt", load("arc42/11-risks-and-technical-debt.md", "arc42")),
    ("arc42-12", "arc42 — 12 Glossary", load("arc42/12-glossary.md", "arc42")),
]

toc_bits = ['<h1>HandmadeFinance</h1><p>C4 + arc42 · read in order</p><div class="g">C4 Model</div>']
articles = []
for sid, title, md in sections:
    if sid == "arc42-readme":
        toc_bits.append('<div class="g">arc42</div>')
    toc_bits.append(f'<a href="#sec-{sid}">{htmlmod.escape(title)}</a>')
    body = md_to_html(md)
    articles.append(
        f'<article class="sec" id="sec-{sid}"><div class="md">{body}</div>'
        f'<p class="src">Source: {htmlmod.escape(title)}</p></article>'
    )

page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HandmadeFinance — C4 + arc42 (complete)</title>
  <style>
    :root {{
      --bg: #f4f6f8; --panel: #fff; --ink: #111827; --muted: #4b5563;
      --line: #e5e7eb; --brand: #1d4ed8; --brand2: #1e40af; --nav: #0f172a;
    }}
    * {{ box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; }}
    body {{
      margin: 0; font-family: "Segoe UI", system-ui, sans-serif;
      background: var(--bg); color: var(--ink); line-height: 1.65;
    }}
    .layout {{ display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }}
    aside {{
      position: sticky; top: 0; height: 100vh; overflow: auto;
      background: var(--nav); color: #e5e7eb; padding: 20px 14px 40px;
    }}
    aside h1 {{ font-size: 15px; margin: 0 0 8px; color: #fff; line-height: 1.35; }}
    aside p {{ font-size: 12px; color: #94a3b8; margin: 0 0 16px; }}
    aside a {{ color: #cbd5e1; text-decoration: none; display: block; padding: 6px 8px; border-radius: 6px; font-size: 13px; }}
    aside a:hover {{ background: #1e3a5f; color: #fff; }}
    aside .g {{ font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #64748b; margin: 14px 8px 6px; }}
    main {{ padding: 28px 36px 80px; max-width: 980px; }}
    .hero {{
      background: linear-gradient(135deg, #1d4ed8, #0f172a);
      color: #fff; padding: 28px 32px; border-radius: 16px; margin-bottom: 28px;
    }}
    .hero h2 {{ margin: 0 0 8px; font-size: 26px; }}
    .hero p {{ margin: 0; opacity: .9; }}
    article.sec {{
      background: var(--panel); border: 1px solid var(--line);
      border-radius: 14px; padding: 8px 32px 36px; margin: 0 0 28px;
    }}
    .md h1 {{ font-size: 1.55rem; border-bottom: 2px solid var(--brand); padding-bottom: 8px; }}
    .md h2 {{ font-size: 1.25rem; color: var(--brand2); margin-top: 1.6em; }}
    .md h3 {{ font-size: 1.08rem; }}
    .md img {{ max-width: 100%; height: auto; border: 1px solid var(--line); border-radius: 10px; background: #fff; }}
    .md table {{ border-collapse: collapse; width: 100%; font-size: 14px; margin: 12px 0 20px; }}
    .md th, .md td {{ border: 1px solid var(--line); padding: 8px 10px; vertical-align: top; }}
    .md th {{ background: #eff6ff; text-align: left; }}
    .md pre {{ background: #0f172a; color: #e2e8f0; padding: 14px 16px; border-radius: 10px; overflow: auto; font-size: 13px; }}
    .md code {{ font-family: ui-monospace, Consolas, monospace; font-size: .92em; }}
    .md :not(pre) > code {{ background: #eef2ff; padding: 1px 5px; border-radius: 4px; }}
    .md .mermaid {{ background: #fff; color: #111; padding: 12px; }}
    .src {{ font-size: 12px; color: #64748b; margin: 16px 0 0; }}
    @media print {{
      aside {{ display: none; }}
      .layout {{ display: block; }}
    }}
    @media (max-width: 900px) {{
      .layout {{ grid-template-columns: 1fr; }}
      aside {{ position: relative; height: auto; }}
    }}
  </style>
</head>
<body>
  <div class="layout">
    <aside>{"".join(toc_bits)}</aside>
    <main>
      <div class="hero">
        <h2>HandmadeFinance — complete architecture documentation</h2>
        <p>Full C4 (README, System Context, Container, Component, Code) and arc42 (README + 12 sections). Content is taken from the source Markdown files.</p>
      </div>
      {"".join(articles)}
    </main>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
  <script>
    if (window.mermaid) {{
      mermaid.initialize({{ startOnLoad: false, theme: "neutral", securityLevel: "loose" }});
      mermaid.run({{ querySelector: ".mermaid" }});
    }}
  </script>
</body>
</html>
"""

out.write_text(page, encoding="utf-8")
print("wrote", out, "bytes", out.stat().st_size)
print("articles", len(articles))
