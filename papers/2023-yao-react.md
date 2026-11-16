---
title: "ReAct: Synergizing Reasoning and Acting in Language Models"
title_zh: "ReAct：在語言模型中結合推理與行動"
authors: [Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, Yuan Cao]
year: 2023
venue: "ICLR 2023"
url: "https://arxiv.org/abs/2210.03629"
tags: [prompting, reasoning, agent]
status: reading
added: "2026-11-16"
summary: "讓語言模型交替產生「思考」與「行動」，一邊推理一邊呼叫外部工具取得資訊，提升問答與決策任務的表現與可解釋性。"
related: [2022-wei-chain-of-thought, 2020-lewis-rag]
---

## 研究問題

在這篇論文之前，語言模型的「推理」（例如 Chain-of-Thought）和「行動」（例如產生動作來操作環境）大多被分開研究。

- 只推理不行動：模型只能使用自己內部的知識，無法查證，容易產生錯誤的事實並一路錯下去。
- 只行動不推理：模型缺少規劃與整理資訊的能力，難以處理需要多步驟的任務。

作者想知道：把兩者結合起來，讓模型邊想邊做，會不會比各自單獨使用更好？

## 核心方法

ReAct 讓模型在解決任務時交替產生三種內容：

- **Thought（思考）**：用自然語言寫下目前的推理，例如拆解問題、整理已經得到的資訊、決定下一步。思考本身不會影響外部環境。
- **Action（行動）**：呼叫外部工具或對環境做出動作。
- **Observation（觀察）**：環境回傳的結果，會接回到 prompt 裡讓模型繼續。

在問答與事實查核任務中，論文提供的是一個簡單的 Wikipedia API，只有三個動作：`search[entity]`（搜尋條目）、`lookup[string]`（在頁面中尋找字串）、`finish[answer]`（提交答案）。

整個方法只靠 few-shot prompting：在 prompt 裡放幾個人工寫好的「思考—行動—觀察」軌跡當範例，不需要微調模型。

## 主要結果

- **知識密集任務**（HotpotQA 多步問答、FEVER 事實查核）：ReAct 優於只有行動的版本。單獨使用時在 HotpotQA 上不一定贏過 CoT，但把 ReAct 與 CoT（self-consistency）結合、讓模型在內部知識與外部資訊之間切換時，整體效果最好。
- **決策任務**（ALFWorld 文字遊戲、WebShop 網頁購物）：只用一到兩個範例，ReAct 就比模仿學習與強化學習方法的成功率分別高出絕對值 **34%** 與 **10%**。
- ReAct 產生的軌跡可以讓人看到模型的推理依據與查到的資料，比較容易檢查與信任。

實驗細節的部分我還沒有全部讀完，各資料集的詳細數字之後再補。

## 貢獻與重要性

- 提出一個簡單而通用的框架，把推理與行動整合在同一個 prompt 流程裡。
- 「思考 → 行動 → 觀察」的迴圈成為後來 LLM agent 與工具使用（tool use）的基本模式。
- 顯示外部資訊可以減少模型憑空捏造事實的情況，同時保留推理的彈性。

## 限制與疑問

- 模型有時會陷入重複相同思考與行動的迴圈，無法跳出來（論文的錯誤分析中有提到）。
- 很依賴檢索結果的品質：搜尋到沒有幫助的內容時，推理容易被帶偏。
- few-shot 的設定受限於 prompt 長度，能放的範例軌跡有限；論文也嘗試了用微調來改善。
- 疑問：當可用的工具從 3 個變成幾十個時，這種純靠 prompt 的做法還能維持效果嗎？

## 我的筆記

- 和 [Chain-of-Thought](paper.html?id=2022-wei-chain-of-thought) 的關係：CoT 是「只想不做」，ReAct 多了「做」和「看結果」。
- 和 [RAG](paper.html?id=2020-lewis-rag) 的差別：RAG 的檢索是流程中固定的一步，ReAct 則由模型自己決定要不要查、查什麼、查幾次。
- 現在用的 AI coding agent（讀檔、執行指令、看結果、再決定下一步）基本上就是這個迴圈，讀這篇有助於理解它們為什麼這樣運作。
- 待辦：把 ALFWorld 與 WebShop 的實驗段落讀完，再把狀態改成已讀並補上評分。
