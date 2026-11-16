---
title: "Attention Is All You Need"
title_zh: "你只需要注意力機制"
authors: [Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin]
year: 2017
venue: "NeurIPS 2017"
url: "https://arxiv.org/abs/1706.03762"
tags: [architecture, attention]
status: read
rating: 5
added: "2026-11-16"
summary: "提出完全以注意力機制組成、不使用 RNN 與 CNN 的 Transformer 架構，訓練可平行化，並在機器翻譯上取得當時最佳成績。"
related: [2019-devlin-bert, 2022-hu-lora]
---

## 研究問題

在這篇論文之前，序列轉換任務（例如機器翻譯）的主流是 RNN／LSTM 加上 attention 的 encoder-decoder 模型。RNN 必須一個位置接一個位置依序計算，無法在序列內平行化，序列越長訓練越慢，遠距離的詞之間也比較難建立關聯。

作者想問的是：能不能把遞迴結構完全拿掉，只靠 attention 來處理序列？

## 核心方法

Transformer 仍是 encoder-decoder 架構，但每一層都只由 attention 與前饋網路組成：

- **Scaled Dot-Product Attention**：`Attention(Q, K, V) = softmax(QKᵀ / √d_k) V`。除以 `√d_k` 是為了避免內積過大讓 softmax 的梯度變得太小。
- **Multi-Head Attention**：把 attention 拆成多個 head 平行計算，讓模型同時從不同的表示子空間關注不同位置。
- **Self-attention**：encoder 的每個位置都能直接看到輸入序列的所有位置；decoder 的 self-attention 加上遮罩，確保只能看到已經產生的位置。
- **Positional Encoding**：因為沒有遞迴與卷積，模型本身不知道詞的順序，所以用不同頻率的 sin／cos 函數產生位置編碼，加到詞向量上。
- 每個子層外面都有 residual connection 與 layer normalization。

base 模型的 encoder 與 decoder 各 6 層，`d_model = 512`，8 個 attention head。

## 主要結果

- WMT 2014 英→德翻譯：big 模型達到 **28.4 BLEU**，比當時最好的結果（包含 ensemble）高出超過 2 BLEU。
- WMT 2014 英→法翻譯：big 模型達到 **41.8 BLEU**，是當時單一模型的最佳成績。
- 訓練成本：big 模型在 8 張 P100 GPU 上訓練 3.5 天；base 模型約 12 小時，遠低於先前的最佳模型。
- 在英文句法剖析（constituency parsing）上也有不錯的表現，顯示架構可以推廣到翻譯以外的任務。

## 貢獻與重要性

- 第一個完全基於 attention 的序列轉換模型，證明不需要 RNN 或 CNN。
- 計算可以高度平行化，讓「用更多資料訓練更大的模型」變得可行。
- 是後來 BERT、GPT 系列等幾乎所有大型語言模型的基礎架構，可以說是這個領域最重要的論文之一。

## 限制與疑問

- Self-attention 每一層的計算量與序列長度的平方成正比，處理很長的序列時成本很高；論文中也提到可以把 attention 限制在鄰近範圍內作為未來方向。
- 位置資訊完全靠額外加上的 positional encoding；論文比較了 sinusoidal 與學習式的位置向量，結果幾乎相同。
- 疑問：不同的 attention head 實際上各自學到了什麼？論文附錄有視覺化的例子，但沒有系統性的分析。

## 我的筆記

- 這篇是讀其他 LLM 論文的前置知識。[BERT](paper.html?id=2019-devlin-bert) 只用了 encoder 的部分，[LoRA](paper.html?id=2022-hu-lora) 則是直接對 attention 裡的權重矩陣做低秩更新，先看懂這篇再讀它們會順很多。
- 第一次讀最容易卡住的是 Q、K、V 的意義：可以想成「拿 query 去和每個 key 比對相似度，再用相似度對 value 做加權平均」。
- 之後想找一份簡短的實作，跟著把 multi-head attention 的張量形狀走過一次。
