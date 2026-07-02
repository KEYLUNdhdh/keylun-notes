---
title: 大规模二分图上的高效 Top-k s-biplex 搜索
published: 2026-07-02
updated: 2026-07-02
coverInContent: false
draft: false
pinned: false
---
# **大规模二分图上的高效 Top-k s-biplex 搜索**

## 前置知识

### 各种符号标记

本文考虑无向、无权二分图

$$
G=(L\cup R,E),
$$

其中 L 与 R 是两个互不相交的顶点集合，同侧顶点之间不存在边，且 E\subseteq L\times R。记

$$
V:=L\cup R,\qquad n:=|V|,\qquad m:=|E|.
$$

对顶点集 S\subseteq V，定义

$$
N_S(u)=v\in S\mid (u,v)\in E
$$

为 u 在 S 中的邻居集合，定义

$$
\overline N_S(u)=v\in S\mid (u,v)\in L\times R\setminus E
$$

为 u 在 S 中的非邻居集合。上下文明确时，N_V(u) 简记为 N(u)。

顶点 u 的度为 d(u):=|N(u)|。用 \Delta_S^{(i)} 表示集合 S 中第 i 大的顶点度；L、R、L\cup R 中最大度分别记为 \Delta_L,\Delta_R,\Delta。

对任意顶点 u 和正整数 k，N^k(u) 表示与 u 距离恰为 k 的顶点集合。给定 X\subseteq L、Y\subseteq R，G[X\cup Y] 表示诱导子图。图的直径为任意顶点对距离的最大值。二分补图为

$$
\overline G=(L\cup R,E'),\qquad E'=L\times R\setminus E.
$$

### 图与诱导子图

从原图中删除一些顶点或边，可以得到一个子图。

但**诱导子图**更加严格：只选择顶点，边不能自行决定。

给定顶点集合

$$
S\subseteq V
$$
它诱导出的子图记为
$$
G[S]
$$
这个子图包含：

1. **顶点集合 $S$；**
2. **原图中两个端点都属于 $S$ 的所有边。**

### Clique

在普通图中，如果一个顶点集合 $S$ 中任意两个不同顶点都有边，那么 $S$ 诱导出的子图是一个 clique。

### Biclique

在二分图中，左右两侧内部原本就不允许有边，因此不可能要求“任意两个顶点都相连”。

二分图中的对应概念是 biclique。

选择：

$$
X\subseteq L,\qquad Y\subseteq R.
$$
如果每个 $x\in X$ 都与每个 $y\in Y$ 相连，即

$$
X\times Y\subseteq E,
$$
那么 $G[X\cup Y]$ 是一个 biclique。

### $s$-plex

$s$-plex 是 clique 的松弛形式。

clique 要求一个顶点与集合中其他所有顶点相邻；$s$-plex 允许每个顶点缺少少量连接。

直观上：

> 不再要求所有人两两认识，而是允许每个人最多不认识少数几个人。

不同论文对参数有轻微的下标约定差异，例如是否把顶点自身计算在“非邻接顶点”中，因此阅读某篇论文时应以它给出的度数公式为准。

但核心思想相同：

$$
\text{clique}=\text{完全连接},
$$

$$
s\text{-plex}=\text{近似完全连接}.
$$



### s-biplex

给定正整数 s，若二分图 B=(X\cup Y,E) 满足

$$
|Y|-|N_Y(u)|\le s\iff |\overline{N}_Y(u)| \le s \quad \forall u\in X,    
$$

以及

$$
|X|-|N_X(v)|\le s \iff |\overline{N}_Y(x)| \le s \quad \forall v\in Y,
$$

则称 B 为一个 s-biplex。等价地，每个顶点在对侧至多有 s 个非邻居。

s-biplex 具有**遗传性**：其任意顶点诱导子图仍是 s-biplex。

### 极大 s-biplex

给定二分图 G=(L\cup R,E)、正整数 s 和顶点集 B\subseteq L\cup R。如果 G[B] 是 s-biplex，且不存在严格包含 B 的集合 B' 使 G[B'] 仍为 s-biplex，则称 G[B] 是极大 s-biplex。

极大结构未必足够大，因此引入两侧规模下界 \theta_L,\theta_R，要求

$$
|X|\ge\theta_L,
\qquad |Y|\ge\theta_R.
$$

这些下界用于过滤一侧极大、另一侧极小的极端不平衡结构。本文集中考虑 \theta_L,\theta_R\ge 2s+1 的情形；已有结果表明，此时目标结构连通且直径不超过 3。

### clique、biclique、$s$-plex、$s$-biplex的关系

这四个概念本质上是两组对应关系：

$$
\text{clique}\longrightarrow \text{s-plex}
$$
和
$$
\text{biclique}\longrightarrow \text{s-biplex}.
$$
前者用于普通图，后者用于二分图。

## 问题定义

### 问题 1：Top-k s-biplex 搜索（TBS）

输入二分图  $G=(V=L∪R,E)$ 和正整数
$$
k>0, \quad s>0, \quad θL≥2s+1,\quad θR≥2s+1.
$$
目标是找出规模最大的 $k$ 个顶点子集 $S⊆V$，使：

1. $G[S]$ 是极大 s-biplex；
2. $|S∩L|≥θL， |S∩R|≥θR。$

当  $k=1$ 时，TBS 等价于在规模约束下寻找最大 s-biplex。

### 定理 1

TBS 问题是 NP-hard。

### 定理 1 的证明

证明从二分图上的**受约束最小顶点覆盖**（CMVC）问题出发，并分两步完成。

#### 第一步：CMVC 规约到带规模约束的最大 biclique

**CMVC 就是二分图上带有约束的 Vertex Cover 问题，本身为 NP-hard。**

给定二分图 G=(L\cup R,E) 和约束 k_L,k_R，CMVC 要求寻找最小顶点集 T\subseteq V，使每条边至少有一个端点属于 T，且 |T\cap L|\le k_L、|T\cap R|\le k_R。**意思是两边选的顶点数量有约束，不能太多。**

根据顶点覆盖与独立集的互补关系，若 T 是这样的最小顶点覆盖，则 V\setminus T 是最大独立集，并且左侧至少包含 |L|-k_L 个顶点、右侧至少包含 |R|-k_R 个顶点。在二分补图 \overline G 中，独立集对应完全二分子图。因此：

**T 是 G 中的受约束最小顶点覆盖，当且仅当 V\setminus T 是 \overline G 中满足两侧规模约束的最大 biclique。**

> 独立集：一个点集 $V$，如果内部所有顶点之间没有边连接，则称其为一个独立集，它的补图显然是一个 biclique。 

#### 第二步：带规模约束的最大 biclique 规约到 BISPLEX/TBS

![Screenshot 2026-07-02 142725](<Screenshot 2026-07-02 142725.png>)

定义判定问题：

- **BICLIQUE：** 输入 G,k_L,k_R,\alpha，问是否存在大小为 \alpha 的 biclique，左侧至少含 k_L 个顶点、右侧至少含 k_R 个顶点。
- **BISPLEX：** 输入 G,s,\theta_L,\theta_R,\alpha'，问是否存在大小为 \alpha' 的 s-biplex，左侧至少含 \theta_L 个顶点、右侧至少含 \theta_R 个顶点。

给定 BICLIQUE 实例 \langle G,k_L,k_R,\alpha\rangle，构造图 G'。首先建立 2s-1 个空边复制层 G_i=(L_i\cup R_i,E_i)：当 i\le s-1 时取 L_i=L,R_i=R；当 i\ge s 时交换两侧，取 L_i=R,R_i=L。随后加入边，**使每个原顶点及复制顶点都与对侧除其对应副本外的所有顶点相连**。记所有复制顶点集合为 L'\cup R'，最终得到

$$
G'=(L\cup L'\cup R\cup R',E\cup E').
$$

上图给出了构造示例。令

$$
\theta_L=k_L+(2s-1)|L|,
$$

$$
\theta_R=k_R+(2s-1)|R|,
$$

$$
\alpha'=\alpha+(2s-1)n.
$$

若原图存在 biclique B=B_L\cup B_R，则

$$
B'=B_L\cup L'\cup B_R\cup R'
$$

是 G' 中的 s-biplex：每个顶点恰好或至多把其 **s 个不相邻位置用于自己的复制副本，并满足规定的总规模和两侧下界。**

反之，若 G' 中存在满足规模要求的 s-biplex，可以证明在不减小两侧规模的条件下，把所有复制顶点补入该解；随后利用遗传性删去多余原始顶点，使总大小恰为 \alpha'。此时至少保留 k_L 个原始左侧顶点和 k_R 个原始右侧顶点。由于每个原始顶点允许的 s 个非邻居已全部对应复制副本，原始左右顶点之间必须完全相连，从而在原图中得到大小为 \alpha 的 biclique。

因此，BICLIQUE 与构造后的 BISPLEX 等价，CMVC 可在多项式时间内规约到 TBS，所以 TBS 为 NP-hard。证毕。

