---
title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding"
title_zh: "BERT：用於語言理解的深層雙向 Transformer 預訓練"
authors: [Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova]
year: 2019
venue: "NAACL 2019"
url: "https://arxiv.org/abs/1810.04805"
tags: [pretraining, fine-tuning]
status: read
rating: 5
added: "2026-11-16"
summary: "用遮罩語言模型預訓練雙向 Transformer encoder，再加一層輸出層微調，就在 11 項 NLP 任務上刷新紀錄。"
related: [2017-vaswani-attention-is-all-you-need, 2022-hu-lora, 2020-lewis-rag]
---

## 研究問題

在 BERT 之前，預訓練語言表示的方法大多是單向的：例如 OpenAI GPT 只能由左到右看上文，ELMo 則是把兩個方向各自訓練的模型接在一起。作者認為單向的限制對句子層級的任務不理想，對問答這類需要同時看前後文的任務傷害更大。

問題是：一般的語言模型目標沒辦法直接做成雙向，因為每個詞會間接「看到自己」。要怎麼預訓練一個真正深層雙向的模型？

## 核心方法

BERT 的架構是多層的 Transformer encoder，預訓練使用兩個任務：

- **Masked Language Model（MLM）**：隨機選出 15% 的 token 讓模型預測。被選中的 token 有 80% 換成 `[MASK]`、10% 換成隨機 token、10% 保持不變，用來減輕預訓練與微調時輸入不一致的問題。
- **Next Sentence Prediction（NSP）**：給兩個句子，判斷第二句是不是原文中緊接在第一句後面的句子，讓模型學到句子之間的關係。

預訓練資料是 BooksCorpus 與英文 Wikipedia。輸入以 `[CLS]` 開頭、用 `[SEP]` 分隔句子；微調時只要在上面加一層輸出層，所有參數一起訓練。

| 模型 | 層數 | 隱藏維度 | Attention head | 參數量 |
|---|---|---|---|---|
| BERT-base | 12 | 768 | 12 | 110M |
| BERT-large | 24 | 1024 | 16 | 340M |

## 主要結果

- 在 11 項 NLP 任務上取得當時最佳成績。
- GLUE 分數提升到 **80.5%**（絕對進步 7.7 個百分點）。
- SQuAD v1.1 問答 Test F1 達到 **93.2**；SQuAD v2.0 Test F1 達到 **83.1**。
- 消融實驗顯示：拿掉雙向性或 NSP 都會讓部分任務的表現下降；模型越大效果越好，即使下游任務的資料量很小也是如此。

## 貢獻與重要性

- 證明了「雙向預訓練」對語言理解任務的重要性。
- 確立了「先大規模預訓練，再針對任務微調」的做法，之後幾年的 NLP 研究幾乎都建立在這個模式上。
- 同一個預訓練模型不需要針對任務設計特殊架構，就能處理句子分類、序列標註、問答等不同類型的任務。

## 限制與疑問

- `[MASK]` 只出現在預訓練階段，微調時不會出現，造成兩個階段的不一致（論文用 80/10/10 的策略緩解，但沒有完全消除）。
- 每個 batch 只有 15% 的 token 被拿來預測，收斂所需的訓練步數比由左到右的語言模型多。
- BERT 是 encoder-only 的模型，不適合直接拿來做文字生成。
- 疑問：NSP 到底有多大幫助？後續有研究（例如 RoBERTa）認為拿掉 NSP 影響不大，這部分我還沒有讀原文確認（待查證）。

## 我的筆記

- 建議先讀 [Attention Is All You Need](paper.html?id=2017-vaswani-attention-is-all-you-need)，BERT 的模型本體就是它的 encoder，論文裡也直接省略了架構細節。
- BERT 的「全部參數一起微調」在模型變得很大之後成本很高，這正是 [LoRA](paper.html?id=2022-hu-lora) 想解決的問題。
- [RAG](paper.html?id=2020-lewis-rag) 的檢索器用的也是 BERT 類的 encoder 來把問題和文件轉成向量，可以看到 BERT 在生成式模型的時代仍然被用在檢索上。
