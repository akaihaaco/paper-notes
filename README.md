# 論文札記 PaperNotes

個人論文資料整理網站：把讀過的論文整理成**格式一致**的中文筆記，可以搜尋、依主題瀏覽。

這個專案的重點是 [`CLAUDE.md`](CLAUDE.md) —— 一套讓 AI 可以持續新增論文與頁面的規則。

## 專案特色

- **一篇論文一個 Markdown 檔**（`papers/`），固定的書目欄位 + 固定六個章節。
- **純靜態網站**：HTML + CSS + 原生 JavaScript，沒有框架、沒有 npm。
- **規則可以被檢查**：`scripts/build.py` 會驗證檔名、欄位、標籤與章節順序，通過才產生 `data/papers.json`。
- **新增論文不用改網頁**：列表、主題索引、單篇頁面都從資料自動產生。

## 使用方式

```bash
python scripts/build.py        # 檢查筆記格式並產生 data/papers.json
python -m http.server 8000     # 本機預覽 http://localhost:8000/
```

## 新增一篇論文

對 AI 說：

> 依照 CLAUDE.md，幫我新增這篇論文的筆記：https://arxiv.org/abs/xxxx.xxxxx

或手動：複製 `templates/paper-template.md` 到 `papers/<年份>-<第一作者姓氏>-<短標題>.md`，填寫後執行 `python scripts/build.py`。

## 目錄

| 路徑 | 說明 |
|---|---|
| `CLAUDE.md` | 給 AI 的專案規則 |
| `papers/` | 論文筆記原始檔 |
| `config/tags.json` | 主題標籤清單 |
| `data/papers.json` | 自動產生的資料（勿手改） |
| `templates/` | 論文筆記與頁面範本 |
| `scripts/build.py` | 檢查 + 建置腳本 |
| `index.html`、`paper.html`、`topics.html`、`about.html` | 網站頁面 |
