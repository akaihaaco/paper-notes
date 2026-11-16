---
title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"
title_zh: "用於知識密集型 NLP 任務的檢索增強生成"
authors: [Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, Sebastian Riedel, Douwe Kiela]
year: 2020
venue: "NeurIPS 2020"
url: "https://arxiv.org/abs/2005.11401"
tags: [retrieval]
status: read
rating: 4
added: "2026-11-16"
summary: "把預訓練的生成模型與可檢索的 Wikipedia 向量索引結合，讓模型先檢索文件再生成答案，知識可以直接更換而不必重新訓練。"
related: [2019-devlin-bert, 2023-yao-react]
---

## 研究問題

大型預訓練語言模型把知識存在參數裡，但這種「參數式記憶」有幾個問題：很難更新或修正裡面的知識、無法說明答案的依據，而且可能產生看似合理但錯誤的內容（hallucination）。

作者想讓生成模型在回答時可以存取一個外部的、明確的知識來源，並且讓「檢索」與「生成」可以一起端到端地微調。

## 核心方法

RAG 結合兩種記憶：

- **參數式記憶**：預訓練的 seq2seq 模型 BART，負責生成。
- **非參數式記憶**：Wikipedia 的稠密向量索引（約 2,100 萬個、每個 100 字的段落），由 DPR（Dense Passage Retriever）檢索。

流程是：把輸入用 query encoder 轉成向量 → 用最大內積搜尋找出前 K 篇文件 → 把每篇文件接在輸入後面交給 BART 生成 → 對這 K 篇文件做邊際化（marginalize）得到最後的輸出機率。

論文提出兩種邊際化的方式：

- **RAG-Sequence**：整個輸出序列都使用同一篇檢索到的文件。
- **RAG-Token**：每個輸出 token 可以依據不同的文件。

訓練時只微調 query encoder 與生成器；文件 encoder 與索引保持固定，避免每次更新都要重建索引。

## 主要結果

- 在三個開放領域問答資料集（Natural Questions、WebQuestions、CuratedTrec）上取得當時最佳成績，勝過純參數式的 seq2seq 模型，也勝過專門設計的「檢索後抽取」架構。
- 在生成任務（MS-MARCO、Jeopardy 問題生成）上，產生的內容比 BART 基準模型更具體、更多樣，也更符合事實。
- 在事實查核資料集 FEVER 上，不需要檢索的監督訊號就能接近當時使用複雜流程的最佳模型。
- 把索引從舊版 Wikipedia 換成新版，模型的答案會跟著更新，不需要重新訓練。

## 貢獻與重要性

- 提出一個通用的做法：任何 seq2seq 任務都能用同一套「檢索 + 生成」的模型微調，而不是替每個任務設計架構。
- 「RAG」這個名稱與概念後來成為讓 LLM 使用外部知識的標準做法，現在常見的知識庫問答系統幾乎都是這個想法的延伸。
- 說明了把知識放在模型外面的好處：可更新、可檢視來源。

## 限制與疑問

- 生成品質受限於檢索品質：檢索不到相關文件時，模型只能依靠自己的參數式記憶。
- 知識來源是 Wikipedia，論文也提到外部知識庫本身可能帶有偏誤或錯誤。
- 文件 encoder 固定不訓練，是為了成本所做的折衷。
- 疑問：論文中的 RAG 需要微調；現在常見的做法是不微調、直接把檢索結果放進 prompt，兩種做法的效果差多少？

## 我的筆記

- 這篇的檢索器 DPR 是以 [BERT](paper.html?id=2019-devlin-bert) 為基礎的雙 encoder，把問題與文件轉成向量後比較內積。
- 和 [ReAct](paper.html?id=2023-yao-react) 對照著看很有意思：RAG 是「固定先檢索一次再生成」，ReAct 則是讓模型自己決定什麼時候要查資料、要查什麼。
- 這個網站本身的做法（把論文知識整理在模型之外的檔案裡，需要時再讓 AI 讀取）其實也有 RAG「知識外部化」的精神。
