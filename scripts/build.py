#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""論文札記建置腳本。

讀取 papers/*.md，依 CLAUDE.md 第 4、5 節的規則檢查格式，
通過後產生 data/papers.json 給網頁使用。

用法：
    python scripts/build.py           檢查並產生 data/papers.json
    python scripts/build.py --check   只檢查，不寫檔

只使用 Python 3 標準函式庫。
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAPERS_DIR = ROOT / "papers"
TAGS_FILE = ROOT / "config" / "tags.json"
OUT_FILE = ROOT / "data" / "papers.json"

REQUIRED_SECTIONS = ["研究問題", "核心方法", "主要結果", "貢獻與重要性", "限制與疑問", "我的筆記"]
STATUSES = ["read", "reading", "to-read"]
REQUIRED_FIELDS = ["title", "authors", "year", "venue", "url", "tags", "status", "added", "summary"]
KNOWN_FIELDS = REQUIRED_FIELDS + ["title_zh", "rating", "related"]
LIST_FIELDS = ["authors", "tags", "related"]
ID_RE = re.compile(r"^(\d{4})-[a-z]+(?:-[a-z0-9]+)+$")
TAG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SUMMARY_MAX = 100
TAGS_MAX = 4


def unquote(text):
    text = text.strip()
    if len(text) >= 2 and text[0] == text[-1] and text[0] in "\"'":
        return text[1:-1]
    return text


def split_list(inner):
    """以逗號切開清單內容，引號內的逗號不切。"""
    items, buf, quote = [], "", None
    for ch in inner:
        if quote:
            buf += ch
            if ch == quote:
                quote = None
        elif ch in "\"'":
            quote = ch
            buf += ch
        elif ch == ",":
            items.append(buf)
            buf = ""
        else:
            buf += ch
    if buf.strip():
        items.append(buf)
    return [unquote(item) for item in items if item.strip()]


def parse_value(raw):
    raw = raw.strip()
    if raw.startswith("["):
        if not raw.endswith("]"):
            raise ValueError("清單必須寫在同一行，並以 ] 結尾")
        return split_list(raw[1:-1])
    if re.fullmatch(r"-?\d+", raw):
        return int(raw)
    return unquote(raw)


def parse_paper(path):
    """回傳 (meta, body, errors)。"""
    errors = []
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    match = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not match:
        return {}, "", ["找不到 frontmatter（檔案必須以 --- 開頭，並以 --- 結束 frontmatter）"]
    meta = {}
    for line in match.group(1).split("\n"):
        if not line.strip():
            continue
        key, sep, raw = line.partition(":")
        key = key.strip()
        if not sep or not re.fullmatch(r"[a-z_]+", key):
            errors.append("frontmatter 這一行看不懂：%s" % line)
            continue
        if key in meta:
            errors.append("frontmatter 欄位重複：%s" % key)
            continue
        try:
            meta[key] = parse_value(raw)
        except ValueError as exc:
            errors.append("欄位 %s：%s" % (key, exc))
    return meta, match.group(2), errors


def check_meta(paper_id, meta, tags_config):
    errors = []
    for key in meta:
        if key not in KNOWN_FIELDS:
            errors.append("不認得的欄位：%s" % key)
    for key in REQUIRED_FIELDS:
        if key not in meta or meta[key] in ("", []):
            errors.append("缺少必填欄位：%s" % key)
    for key in LIST_FIELDS:
        if key in meta and not isinstance(meta[key], list):
            errors.append("欄位 %s 必須是清單，例如 [a, b]" % key)

    id_match = ID_RE.match(paper_id)
    if not id_match:
        errors.append("檔名不符合「<年份>-<第一作者姓氏>-<短標題>.md」（小寫英文、數字、連字號）")
    year = meta.get("year")
    if "year" in meta:
        if not isinstance(year, int):
            errors.append("year 必須是整數")
        elif id_match and int(id_match.group(1)) != year:
            errors.append("檔名年份（%s）與 year（%s）不一致" % (id_match.group(1), year))

    url = meta.get("url")
    if url and not re.match(r"^https?://", str(url)):
        errors.append("url 必須以 http:// 或 https:// 開頭")

    tags = meta.get("tags")
    if isinstance(tags, list):
        if len(tags) > TAGS_MAX:
            errors.append("tags 最多 %d 個" % TAGS_MAX)
        for tag in tags:
            if tag not in tags_config:
                errors.append("標籤「%s」不在 config/tags.json 裡" % tag)

    status = meta.get("status")
    if status and status not in STATUSES:
        errors.append("status 只能是：%s" % "、".join(STATUSES))
    if "rating" in meta:
        rating = meta["rating"]
        if not isinstance(rating, int) or not 1 <= rating <= 5:
            errors.append("rating 必須是 1–5 的整數")
        if status in STATUSES and status != "read":
            errors.append("只有 status: read 的論文可以填 rating")
    elif status == "read":
        errors.append("status: read 的論文必須填 rating")

    added = meta.get("added")
    if added:
        try:
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(added)):
                raise ValueError
            date.fromisoformat(str(added))
        except ValueError:
            errors.append("added 必須是 \"YYYY-MM-DD\" 格式的有效日期")

    summary = meta.get("summary")
    if isinstance(summary, str) and len(summary) > SUMMARY_MAX:
        errors.append("summary 太長（%d 字），上限 %d 字" % (len(summary), SUMMARY_MAX))
    return errors


def check_body(body):
    errors = []
    sections = []  # [標題, 是否有內容]
    in_code = False
    for line in body.split("\n"):
        if line.strip().startswith("```"):
            in_code = not in_code
            if sections:
                sections[-1][1] = True
            continue
        if not in_code and re.match(r"^# \S", line):
            errors.append("內文不可使用一級標題（# ）：%s" % line.strip())
            continue
        heading = None if in_code else re.match(r"^## +(.+?)\s*$", line)
        if heading:
            sections.append([heading.group(1), False])
        elif line.strip():
            if sections:
                sections[-1][1] = True
            else:
                errors.append("第一個章節標題之前不可有內文：%s" % line.strip()[:20])
    names = [name for name, _ in sections]
    if names != REQUIRED_SECTIONS:
        errors.append("章節必須依序為：%s（目前是：%s）" % (
            "、".join(REQUIRED_SECTIONS), "、".join(names) or "無"))
    for name, has_content in sections:
        if not has_content:
            errors.append("章節「%s」是空的（還沒讀請寫「待補」）" % name)
    return errors


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    check_only = "--check" in sys.argv[1:]
    problems = {}

    try:
        tags_config = json.loads(TAGS_FILE.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError) as exc:
        print("[錯誤] 無法讀取 config/tags.json：%s" % exc)
        return 1
    for tag_id, info in tags_config.items():
        if not TAG_RE.match(tag_id):
            problems.setdefault("config/tags.json", []).append("標籤 id「%s」必須是小寫英文與連字號" % tag_id)
        if not isinstance(info, dict) or not info.get("label") or not info.get("desc"):
            problems.setdefault("config/tags.json", []).append("標籤「%s」缺少 label 或 desc" % tag_id)

    papers = []
    for path in sorted(PAPERS_DIR.glob("*.md")):
        paper_id = path.stem
        meta, body, errors = parse_paper(path)
        if meta:
            errors += check_meta(paper_id, meta, tags_config)
            errors += check_body(body)
        if errors:
            problems["papers/%s" % path.name] = errors
        papers.append({
            "id": paper_id,
            "title": meta.get("title", ""),
            "title_zh": meta.get("title_zh", ""),
            "authors": meta.get("authors", []),
            "year": meta.get("year", 0),
            "venue": meta.get("venue", ""),
            "url": meta.get("url", ""),
            "tags": meta.get("tags", []),
            "status": meta.get("status", ""),
            "rating": meta.get("rating"),
            "added": meta.get("added", ""),
            "summary": meta.get("summary", ""),
            "related": meta.get("related", []),
        })

    ids = {paper["id"] for paper in papers}
    for paper in papers:
        for rel in paper["related"] if isinstance(paper["related"], list) else []:
            if rel == paper["id"]:
                problems.setdefault("papers/%s.md" % paper["id"], []).append("related 不可以指向自己")
            elif rel not in ids:
                problems.setdefault("papers/%s.md" % paper["id"], []).append("related 指向不存在的論文：%s" % rel)

    if problems:
        total = sum(len(v) for v in problems.values())
        print("[錯誤] 共 %d 個問題，請修正後再執行：\n" % total)
        for name, errors in problems.items():
            print(name)
            for err in errors:
                print("  - %s" % err)
        return 1

    papers.sort(key=lambda p: (-p["year"], p["id"]))
    tags_out = {}
    for tag_id, info in tags_config.items():
        tags_out[tag_id] = {
            "label": info["label"],
            "desc": info["desc"],
            "count": sum(1 for p in papers if tag_id in p["tags"]),
        }
    output = {
        "_note": "本檔由 scripts/build.py 自動產生，請勿手動編輯。",
        "tags": tags_out,
        "papers": papers,
    }
    if check_only:
        print("檢查通過：%d 篇論文、%d 個標籤（未寫入檔案）" % (len(papers), len(tags_out)))
        return 0
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(output, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print("建置完成：%d 篇論文、%d 個標籤 -> data/papers.json" % (len(papers), len(tags_out)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
