---
title: "LoRA: Low-Rank Adaptation of Large Language Models"
title_zh: "LoRA：大型語言模型的低秩適應"
authors: [Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang, Weizhu Chen]
year: 2022
venue: "ICLR 2022"
url: "https://arxiv.org/abs/2106.09685"
tags: [fine-tuning, peft]
status: read
rating: 5
added: "2026-11-16"
summary: "凍結預訓練權重，只訓練插入的低秩矩陣 A、B，就能用極少的參數達到接近完整微調的效果，而且推論時不增加延遲。"
related: [2019-devlin-bert, 2017-vaswani-attention-is-all-you-need]
---

## 研究問題

預訓練模型越來越大，完整微調（更新所有參數）的成本也越來越高：每個下游任務都要存一份和原模型一樣大的參數，以 GPT-3（約 1,750 億參數）來說幾乎不可行。

既有的替代方法各有缺點：adapter 在模型裡插入額外的層，會增加推論延遲；prefix tuning 比較難最佳化，而且會佔用可用的輸入序列長度。作者想找一個參數少、又不犧牲推論速度與效果的方法。

## 核心方法

作者的假設是：模型在適應新任務時，權重的「變化量」ΔW 具有很低的內在秩（intrinsic rank）。

- 對一個預訓練權重矩陣 `W₀`（大小 d × k），不直接更新它，而是把更新量表示成兩個小矩陣的乘積：`W = W₀ + BA`，其中 B 是 d × r、A 是 r × k，而 r 遠小於 d 和 k。
- 訓練時 `W₀` 凍結，只訓練 A 和 B。A 用隨機高斯初始化、B 初始化為零，所以一開始 `BA = 0`，模型行為和原本完全相同。
- 更新量會乘上 `α / r` 做縮放。
- 實驗中只對 Transformer 的 attention 權重加上 LoRA（主要是 query 與 value 的投影矩陣），其他部分全部凍結。
- 部署時可以把 `BA` 直接加回 `W₀`，所以推論時**沒有額外延遲**；要換任務時只需要換掉小小的 A、B。

## 主要結果

- 以 GPT-3 為例，可訓練參數量減少約 **10,000 倍**，訓練時的 GPU 記憶體需求減少約 **3 倍**。
- 在 RoBERTa、DeBERTa、GPT-2、GPT-3 上，LoRA 的表現與完整微調相當或更好。
- 很小的秩就已經足夠：論文的分析顯示 r 只有 1 或 2 時在部分任務上也能有不錯的表現，支持「更新量是低秩的」這個假設。
- 在相同的參數預算下，同時調整 query 與 value 矩陣比只調整單一矩陣效果好。

## 貢獻與重要性

- 提出簡單、通用、而且不增加推論成本的參數高效微調方法。
- 讓一般人用單張 GPU 微調大型模型變得可行；同一個基礎模型可以搭配很多個小的 LoRA 權重來切換任務。
- 之後成為語言模型與影像生成模型社群最常用的微調方式之一。

## 限制與疑問

- 如果把 A、B 合併回 `W₀` 以消除延遲，就不容易在同一個 batch 裡同時處理需要不同 LoRA 權重的任務（論文自己提到的限制）。
- 要對哪些權重矩陣加 LoRA、秩 r 要設多少，主要還是依靠經驗與實驗來決定。
- 疑問：「更新量是低秩的」這個假設，在下游任務與預訓練資料差異很大的情況下是否仍然成立？

## 我的筆記

- 和 [BERT](paper.html?id=2019-devlin-bert) 的完整微調對照：BERT 時代模型只有幾億個參數，全部更新還可以接受；模型大了上千倍之後，才需要 LoRA 這類方法。
- LoRA 作用的位置就是 [Transformer](paper.html?id=2017-vaswani-attention-is-all-you-need) attention 裡的投影矩陣，回頭複習一下 Q、K、V 的矩陣會更清楚它改了什麼。
- 「B 初始化為零」這個細節很漂亮：保證訓練的起點就是原本的預訓練模型。
