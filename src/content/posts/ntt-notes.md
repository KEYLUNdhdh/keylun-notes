---
title: NTT 学习笔记：从卷积到实现
published: 2026-06-27
description: 整理 NTT 的问题背景、核心公式、实现细节和容易写错的地方。
cover: /assets/images/desktopWallpaper_2.jpg
coverInContent: false
pinned: false
tags: [algorithm, number-theory, cpp]
category: 算法笔记
draft: false
---

NTT 可以看作是在模意义下做 FFT。它的核心用途是快速计算多项式卷积，把朴素的 \(O(n^2)\) 复杂度降到 \(O(n \log n)\)。

## 为什么需要 NTT

在竞赛和工程实现里，卷积经常出现：

- 多项式乘法
- 生成函数
- 计数 DP 优化
- 大整数乘法

FFT 使用复数，精度处理比较麻烦；NTT 使用模数和原根，结果完全在整数域中计算，适合需要精确取模的场景。

## 实现要点

1. 选择形如 \(c \cdot 2^k + 1\) 的 NTT 友好模数。
2. 找到对应原根。
3. 进行 bit-reversal 置换。
4. 逐层合并 butterfly。
5. 逆变换后乘以 \(n^{-1}\)。

## 容易写错的地方

- 忘记把长度扩展到 2 的幂。
- 逆变换没有乘逆元。
- 原根幂次方向写反。
- 中间乘法没有转成 `long long`。

NTT 的模板不难背，真正需要理解的是“单位根分治”这件事。理解以后，FFT、NTT 和 FWT 的记忆负担都会下降很多。
