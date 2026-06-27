---
title: "NTT 学习笔记：从卷积到实现"
description: "整理 NTT 的问题背景、核心公式、实现细节和容易写错的地方。"
pubDate: 2026-06-27
tags: ["algorithm", "number-theory", "cpp"]
---

多项式乘法可以写成卷积：

```text
C_k = sum(A_i * B_j), where i + j = k
```

朴素做法是 O(nm)，当多项式很长时会成为瓶颈。NTT 的思路是把系数表示转换到点值表示，在点值域里逐点相乘，再反变换回来。

## 实现 checklist

- 选择形如 `p = c * 2^k + 1` 的模数。
- 确认原根和每一层单位根方向。
- bit-reversal 不要越界。
- 反变换后乘以 `n^{-1}`。
- 结果长度通常是 `a.size() + b.size() - 1`。

## 模板形态

```cpp
void ntt(vector<int>& a, bool invert) {
    int n = a.size();
    // bit reversal
    // layers
    // normalize if invert
}
```

之后可以继续补：常用模数、CRT 合并、形式幂级数里 NTT 的使用方式。
