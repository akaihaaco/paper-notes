# CLAUDE.md — 論文札記 PaperNotes

這份文件是給 AI 助理（Claude Code、Codex 等）看的專案說明書。
**開始任何工作前請先讀完本檔**，之後所有新增與修改都必須遵守這裡的規則。
如果使用者的要求與本檔衝突，先指出衝突並詢問，不要默默違反規則。

---

## 1. 專案目的

「論文札記」是一個**個人論文資料整理網站**：把讀過（或準備讀）的論文，整理成格式統一的中文筆記，
放在網站上方便搜尋、依主題瀏覽與日後複習。

- 目標讀者：網站擁有者本人，以及想快速了解某篇論文的同學。
- 核心價值：**每篇論文的筆記長得一樣**（同樣的欄位、同樣的章節），所以可以快速比較、快速新增。
- 這個專案的重點不是「做出一個網頁」，而是「**維持一套可以一直加論文進來的規則**」。

## 2. 技術原則

1. **純靜態網站**：只有 HTML、CSS、原生 JavaScript。不使用 React/Vue、不使用 npm、不需要打包。
2. **內容與版面分離**：論文內容只寫在 `papers/*.md`；版面只寫在 HTML/CSS/JS。新增論文**不需要也不可以**改 HTML。
3. **唯一的建置步驟**是 `python scripts/build.py`，只用 Python 3 標準函式庫（不可 `pip install` 任何東西）。
4. 部署在 GitHub Pages（`main` 分支根目錄）。所有連結一律用**相對路徑**（例如 `assets/css/style.css`），
   不可用 `/` 開頭的絕對路徑，否則在 `https://<帳號>.github.io/paper-notes/` 下會壞掉。
5. 唯一允許的外部資源：Google Fonts（Noto Serif TC、Noto Sans TC）與 cdnjs 上固定版本的 `marked`（Markdown 轉 HTML）。
   要新增其他外部資源前必須先問使用者。

## 3. 目錄結構

```
paper-notes/
├── CLAUDE.md               ← 本檔：專案規則（唯一的規則來源）
├── AGENTS.md               ← 只是一行指向 CLAUDE.md，不要在裡面寫規則
├── README.md               ← 給人看的簡介
├── .nojekyll               ← 讓 GitHub Pages 原樣提供 .md 檔，不可刪除
├── index.html              ← 首頁：論文列表（搜尋、標籤／狀態篩選、排序）
├── paper.html              ← 單篇論文頁：paper.html?id=<論文 id>
├── topics.html             ← 主題索引：依標籤分組
├── about.html              ← 關於本站與筆記格式說明
├── assets/
│   ├── css/style.css       ← 全站唯一的樣式表（含設計變數）
│   └── js/
│       ├── site.js         ← 共用：導覽列、頁尾、資料載入、小工具（全站都要載入）
│       ├── index.js        ← 只給 index.html 用
│       ├── paper.js        ← 只給 paper.html 用
│       └── topics.js       ← 只給 topics.html 用
├── papers/                 ← ★ 論文筆記原始檔，一篇一個 .md
├── config/tags.json        ← 標籤清單（手動維護，新增標籤要改這裡）
├── data/papers.json        ← ⚠ 由 build.py 自動產生，禁止手動編輯
├── templates/
│   ├── paper-template.md   ← 新增論文時複製這個
│   └── page-template.html  ← 新增頁面時複製這個
└── scripts/build.py        ← 檢查所有筆記格式並產生 data/papers.json
```

放置規則：

- 論文筆記只能放 `papers/`，不可建立子資料夾。
- 圖片放 `assets/img/<論文 id>/`，檔名用小寫英文與連字號（目前沒有圖片，需要時再建立）。
- 不可在專案根目錄新增雜項檔案（草稿、備份、`test.html` 等）。

## 4. 論文筆記格式（最重要）

### 4.1 檔名 = 論文 id

格式：`<年份>-<第一作者姓氏>-<短標題>.md`

- 全部小寫英文、數字與連字號 `-`，不可有空白、底線、中文。
- 年份 = 正式發表年份（會議／期刊年份）；只有 arXiv 版本時用 arXiv 首次公開年份。必須與 frontmatter 的 `year` 相同。
- 短標題：論文有通用簡稱就用簡稱（`bert`、`lora`、`rag`），否則取標題關鍵字，最多 6 個單字。
- 檔名去掉 `.md` 就是論文 id，會出現在網址 `paper.html?id=<id>`。**發布後不可改名**（會讓舊連結失效）。

範例：`2017-vaswani-attention-is-all-you-need.md`、`2019-devlin-bert.md`

### 4.2 Frontmatter（檔案最上方 `---` 之間）

`build.py` 用的是簡化解析器，請嚴格遵守：**一行一個欄位**、字串一律用雙引號、清單寫成同一行的 `[a, b, c]`、不可寫註解、不可用多行或巢狀結構。

| 欄位 | 必填 | 型別 | 規則 |
|---|---|---|---|
| `title` | ✔ | 字串 | 論文**原文**標題，大小寫照原文 |
| `title_zh` | | 字串 | 中文譯名（自行翻譯即可） |
| `authors` | ✔ | 清單 | 全部作者，照論文順序，寫「名 姓」全名 |
| `year` | ✔ | 整數 | 與檔名年份相同 |
| `venue` | ✔ | 字串 | 例：`"NeurIPS 2017"`、`"ICLR 2022"`、`"arXiv"` |
| `url` | ✔ | 字串 | 論文連結，優先用 arXiv abs 頁（`https://arxiv.org/abs/...`） |
| `tags` | ✔ | 清單 | 1–4 個，必須是 `config/tags.json` 裡已有的 id |
| `status` | ✔ | 字串 | `read`（已讀）／`reading`（閱讀中）／`to-read`（待讀） |
| `rating` | 視狀態 | 整數 | 1–5，個人推薦程度。`status: read` 時必填，其他狀態不可填 |
| `added` | ✔ | 字串 | 加入本站的日期 `"YYYY-MM-DD"`，之後修改內容不用改 |
| `summary` | ✔ | 字串 | 一句話中文摘要，**100 字以內**，會顯示在列表卡片上 |
| `related` | | 清單 | 本站其他論文的 id（必須真的存在） |

### 4.3 內文章節

內文必須**剛好**有以下六個二級標題（`##`），**順序固定、名稱一字不差**，不可增加其他 `##`，不可寫一級標題 `#`（頁面標題由 frontmatter 產生）：

1. `## 研究問題` — 這篇論文想解決什麼？之前的方法卡在哪？（2–4 句）
2. `## 核心方法` — 方法怎麼運作。可用條列、`###` 小標、公式用行內程式碼表示。
3. `## 主要結果` — 最重要的實驗結果，盡量條列並附具體數字。
4. `## 貢獻與重要性` — 為什麼這篇值得讀、對後續研究的影響。
5. `## 限制與疑問` — 論文自己承認的限制 + 讀者的疑問。
6. `## 我的筆記` — 個人心得、與其他論文的關聯、之後想做的事。

- `status: to-read` 的論文，還沒讀到的章節內容寫 `待補`（章節標題仍須存在）。
- 每個章節都不可留空。
- 允許的 Markdown 語法：段落、`###` 小標、有序／無序清單、**粗體**、*斜體*、`行內程式碼`、程式碼區塊、連結、引用區塊 `>`、表格。
  不可寫原始 HTML。
- 提到本站其他論文時，連結寫成 `[BERT](paper.html?id=2019-devlin-bert)`。

### 4.4 寫作規則

- 語言：**繁體中文（台灣用語）**。專有名詞、模型名、資料集名保留英文（Transformer、BLEU、fine-tuning 可寫「微調（fine-tuning）」）。
- 中英文之間加半形空格；使用全形標點（，。：「」）。
- **不可捏造**：作者、年份、會議、數字都必須來自論文本身。不確定的內容不要寫；需要保留但尚未確認時，在句尾標註 `（待查證）`。
- 「主要結果」的數字要寫清楚是哪個資料集、哪個指標。
- 「我的筆記」是使用者的個人觀點：AI 代寫時要語氣保守，並在回報時提醒使用者檢查；**不可覆蓋使用者已寫好的「我的筆記」**，除非使用者明確要求。
- 單篇筆記內文建議 400–900 個中文字，重點是好複習，不是翻譯全文。

## 5. 標籤規則

- 標籤清單在 `config/tags.json`，格式：`"標籤id": { "label": "顯示名稱", "desc": "一句話說明" }`。
- 標籤 id 用小寫英文與連字號；`label` 用中文或通用英文名。
- **優先使用現有標籤**。只有在現有標籤都不適合、且預期之後還會有其他論文用到時才新增；
  新增時要同時在 `config/tags.json` 補上 `label` 與 `desc`，並在回報中告知使用者。
- 不可刪除仍有論文使用的標籤（`build.py` 會報錯）。

## 6. 網頁風格

整體感覺：**安靜的閱讀筆記本** —— 米白紙張底色、深墨色文字、單一墨綠強調色、襯線標題。資訊密度適中，沒有動畫特效。

- 所有顏色、間距、字體都定義在 `assets/css/style.css` 最上方的 CSS 變數（`--bg`、`--surface`、`--ink`、`--muted`、`--line`、`--accent`、`--accent-soft` 等）。
  **寫樣式時只能引用變數，不可直接寫色碼**；需要新顏色就先加變數，並同時補上深色模式的值。
- 字體：標題 `Noto Serif TC`，內文 `Noto Sans TC`，程式碼用系統等寬字體。
- 支援深色模式（`prefers-color-scheme: dark`）與手機版（寬度 ≤ 640px 時單欄）。新增的任何元件都要兩者都能正常顯示。
- 現有元件（請重複使用，不要另外發明）：`.card` 論文卡片、`.tag` 標籤、`.status` 狀態徽章、`.meta-table` 資料表、`.callout` 摘要框、`.btn` 按鈕、`.page-title` 頁面標題區。
- 不使用 emoji 當圖示；不加入追蹤碼、廣告或第三方小工具。

## 7. 頁面結構

| 頁面 | 內容 | 資料來源 |
|---|---|---|
| `index.html` | 統計數字、搜尋框、標籤／狀態篩選、排序、論文卡片列表。支援 `index.html?tag=<標籤id>` | `data/papers.json` |
| `paper.html?id=<id>` | 標題、書目資料表、一句話摘要、六個章節內文、相關論文、上一篇／下一篇 | `data/papers.json` + `papers/<id>.md` |
| `topics.html` | 每個標籤一個區塊：說明 + 該標籤下的論文清單 | `data/papers.json` |
| `about.html` | 本站目的、筆記格式、如何新增論文 | 靜態文字 |

每個頁面的固定骨架（見 `templates/page-template.html`）：

- `<header id="site-header"></header>` 與 `<footer id="site-footer"></footer>` 留空，由 `assets/js/site.js` 自動填入導覽列與頁尾。**不可在各頁面手寫導覽列。**
- 主要內容放在 `<main class="container">` 裡。
- 一律載入 `assets/css/style.css` 與 `assets/js/site.js`；頁面專用的程式放 `assets/js/<頁面名>.js`。
- `<title>` 格式：`<頁面名稱>｜論文札記`。`<html lang="zh-Hant">`。

## 8. 標準作業流程

### 8.1 新增一篇論文（最常見）

1. 確認論文的標題、作者、年份、發表處、連結。資訊不足就先問使用者或請使用者提供論文連結／PDF，不可用猜的。
2. 依 4.1 決定檔名，確認 `papers/` 裡沒有同一篇。
3. 複製 `templates/paper-template.md` 到 `papers/<id>.md`，填好 frontmatter 與六個章節。
4. 檢查 `tags` 是否都在 `config/tags.json`；想想 `related` 可以連到哪些現有論文，並視情況在對方的 `related` 補上這篇（雙向連結）。
5. 執行 `python scripts/build.py`，必須顯示「建置完成」且沒有錯誤。
6. 一起 commit：`papers/<id>.md` + `data/papers.json`（+ 有改到的 `config/tags.json`）。

不需要改任何 HTML、CSS、JS —— 首頁、主題頁、單篇頁會自動出現新論文。

### 8.2 修改既有論文

直接改 `papers/<id>.md`，然後重跑 `python scripts/build.py`。不可改檔名；不可動 `added`。

### 8.3 新增標籤

改 `config/tags.json` → 在論文 frontmatter 使用 → 重跑 build。

### 8.4 新增一個頁面（例如「閱讀時間軸」「年度統計」）

1. 複製 `templates/page-template.html` 為 `<英文小寫名稱>.html`，放在根目錄。
2. 頁面邏輯寫在 `assets/js/<同名>.js`，用 `PN.loadData()` 取得論文資料，用 `PN.escapeHtml()` 處理所有要插入頁面的文字。
3. 在 `assets/js/site.js` 的 `NAV` 陣列加一項，導覽列就會出現在所有頁面。
4. 樣式加在 `assets/css/style.css` 尾端，以註解標明區塊，只用既有 CSS 變數。
5. 更新本檔第 3 節的目錄結構與第 7 節的頁面表格。

### 8.5 新增一種內容類型（例如「研討會筆記」「讀書會紀錄」）

比照論文的做法：一個內容資料夾 + 一個範本 + 在 `build.py` 增加檢查與輸出 + 一個列表頁。
**動手前先向使用者提出格式設計（欄位、章節、檔名規則）並取得同意，再把規則寫進本檔。**

## 9. 指令

```bash
python scripts/build.py           # 檢查全部筆記並重新產生 data/papers.json
python scripts/build.py --check   # 只檢查，不寫檔
python -m http.server 8000        # 本機預覽：http://localhost:8000/
```

本機預覽一定要透過 http server（直接點開 HTML 檔會因為 `fetch` 被瀏覽器擋住而看不到資料）。

## 10. 禁止事項

- ✘ 手動編輯 `data/papers.json`。
- ✘ 為了單一論文去改 HTML／CSS／JS，或把論文內容直接寫進 HTML。
- ✘ 捏造論文資訊或實驗數字。
- ✘ 更改已存在的論文檔名（id）、六個章節的名稱或順序。
- ✘ 引入框架、套件管理工具、建置工具或未經同意的外部資源。
- ✘ 刪除 `.nojekyll`。
- ✘ 在 CSS 裡直接寫色碼、在各頁面手寫導覽列或頁尾。
- ✘ 未經使用者同意就 `git push` 或改動 GitHub 設定。

## 11. 完成前檢查清單

每次修改完，回報使用者前逐項確認：

- [ ] `python scripts/build.py` 通過，沒有錯誤訊息。
- [ ] `data/papers.json` 已隨內容更新（只由 build 產生）。
- [ ] 新檔案的名稱與位置符合第 3、4.1 節。
- [ ] 新內容為繁體中文、六個章節齊全、沒有 `（待查證）` 以外的不確定內容。
- [ ] 若改了版面：桌機、手機寬度、深色模式都看過。
- [ ] 若新增了頁面／標籤／規則：本檔已同步更新。
- [ ] 回報時列出：新增／修改了哪些檔案、有哪些地方需要使用者親自確認（例如「我的筆記」「評分」）。

## 12. Commit 訊息

格式 `<類型>: <說明>`，說明用繁體中文：

- `paper: 新增 LoRA 論文筆記`
- `content: 補充 BERT 的限制與疑問`
- `site: 首頁新增依年份排序`
- `rules: 更新 CLAUDE.md 標籤規則`
- `fix: 修正手機版卡片跑版`
