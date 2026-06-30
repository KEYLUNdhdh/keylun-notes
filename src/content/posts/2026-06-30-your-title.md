---
title: 个人向算法模板
published: 2026-06-30
updated: 2026-06-30
description: 这是我的算法竞赛常用模板，重点参考了 jiangly 老师的码风，更加偏向现代 C++.
coverInContent: false
category: Algorithm
tags:
  - 模板
  - 算法竞赛
  - 个人向
pinned: true
draft: false
---
# 个人模板

#### 敲题模板

```cpp
#include <bits/stdc++.h>
#define debug(x) { cerr << #x << " = " << x << "\n"; }
#define debugarr(x){        \
    cerr << #x << " : ";    \
    for(auto v : x)         \
    cerr << v << " ";   \
    cerr << "\n";           \
}
#define cutline {cerr << "----------------------\n";}
using namespace std;
using i64 = long long;
using u64 = unsigned long long;
using i128 = __int128;
using ld = long double;
using db = double;
typedef pair<int, int> pii;
typedef tuple<int, int, int> piii;
typedef pair<i64, i64> pll;
typedef pair<i128, i128> pllll;
mt19937 rnd(time(0));
template<class T>
void chmax(T &a, T b) 
{
    if (a < b) 
        a = b;
}
template<class T>
void chmin(T &a, T b) 
{
    if (a > b) 
        a = b;
}
constexpr int MOD = 998244353, INF = 1e9;
void solve()
{

}
signed main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    int T = 1;
    cin >> T;
    while(T--)
        solve();
}
```

### 数据结构

#### 并查集

```cpp
struct DSU
{
    vector<int> f, siz;
    DSU() {};
    DSU(int n)
    {
        init(n);
    }
    void init(int n)
    {
        f.resize(n + 1);
        iota(f.begin(), f.end(), 0);
        siz.assign(n + 1, 1);
    }
    int find(int x)
    {
        while(x != f[x])
            x = f[x] = f[f[x]];
        return x;
    }
    bool same(int x,int y)
    {
        return find(x) == find(y);
    }
    bool merge(int x,int y)
    {
        x = find(x);
        y = find(y);
        if(x == y)
            return false;
        if(siz[x] < siz[y])
            swap(x, y);
        siz[x] += siz[y];
        f[y] = x;
        return true;
    }
    int size(int x)
    {
        return siz[find(x)];
    }
};
```

#### 带权并查集

```cpp
struct DSU
{
    vector<int> f, siz, d;
    int mod;//mod的大小代表有几种关系
    DSU(int n,int mod_) : f(n + 1), siz(n + 1, 1), d(n + 1, 0), mod(mod_)
    {
        iota(f.begin(), f.end(), 0);
    }
    int find(int x)
    {
        if (x != f[x])
        {
            int root = find(f[x]);// 递归找根
            d[x] = (d[x] + d[f[x]]) % mod;// 核心：累加路径权值
            f[x] = root;// 路径压缩
        }
        return f[x];
    }
    // 合并 x 和 y，关系为：x -> y 的权值为 v
    // 返回值：true 表示合并成功或者已经在一个集合中且该关系v是正确的，false 表示已经在一个集合且矛盾
    bool merge(int x,int y,int v)
    {
        int rootx = find(x);
        int rooty = find(y);
        if(rootx == rooty)
        {
            int check = (d[x] - d[y] + mod) % mod;
            return check == v;
        }
        if(siz[rootx] < siz[rooty])
        {
            swap(rootx, rooty);
            v = (mod - v) % mod;
            swap(x, y);
        }
        f[rooty] = rootx;
        siz[rootx] += siz[rooty];
        d[rooty] = (d[x] - d[y] - v + mod) % mod;
        return true;
    } 
    int query(int x,int y)
    {
        int rootx = find(x);
        int rooty = find(y);
        if(rootx != rooty)
            return -1;
        return (d[x] - d[y] + mod) % mod;
    }
};
```

#### 可撤销并查集

```cpp
struct DSU
{
    vector<int> f, siz;
    vector<pii> his;//记录历史操作,[y, x]表示y成为了x的儿子
    int part;
    DSU() {}
    DSU(int n)
    {
        init(n);
    }
    void init(int n)
    {
        f.resize(n + 1);
        iota(f.begin(), f.end(), 0);
        siz.assign(n + 1, 1);
        his.clear();
        part = n;
    }
    int find(int x)
    {
        while(x != f[x])
            x = f[x];
        return x;
    }
    bool same(int x,int y)
    {
        return find(x) == find(y);
    }
    bool merge(int x,int y)
    {
        x = find(x);
        y = find(y);
        if(x == y)
            return false;
        if(siz[x] < siz[y])
            swap(x, y);
        his.push_back({y, x});
        siz[x] += siz[y];
        f[y] = x;
        part--;
        return true;
    }
    int size(int x)
    {
        return siz[find(x)];
    }
    // 新增：撤销上一次成功的 merge 操作
    void undo()
    {
        if(his.empty())
            return;
        auto [y, x] = his.back();
        his.pop_back();
        siz[x] -= siz[y];
        f[y] = y;
        part++;
    }
    // 新增：获取当前状态（快照）
    int hissize()
    {
        return his.size();
    }
    // 新增：回滚到之前的某个快照状态
    void rollback(int tag)
    {
        while(his.size() > tag)
            undo();
    }
};
```

#### Treap

```cpp
struct Treap
{
    static const int INF = 1e9;
    vector<int> val, dat, sz, cnt;
    vector<array<int,2>> ch;
    int tot, root;
    Treap() {}
    Treap(int n)
    {
        val.resize(n + 5);
        dat.resize(n + 5);
        sz.resize(n + 5);
        cnt.resize(n + 5);
        ch.resize(n + 5, {0, 0});
        tot = 0;
        root = 0;
        build();
    }
    int New(int v)
    {
        val[++tot] = v;
        dat[tot] = rand();
        sz[tot] = 1;
        cnt[tot] = 1;
        ch[tot][0] = ch[tot][1] = 0;
        return tot;
    }
    void pushup(int id)
    {
        if(!id)
            return;
        sz[id] = cnt[id] + sz[ch[id][0]] + sz[ch[id][1]];
    }

    void rotate(int &id,int d)
    {
        int tp = ch[id][d ^ 1];
        ch[id][d ^ 1] = ch[tp][d];
        ch[tp][d] = id;
        id = tp;
        pushup(ch[id][d]);
        pushup(id);
    }
    void build()
    {
        root = New(-INF);
        ch[root][1] = New(INF);
        pushup(root);
    }
    void insert(int &id,int v)
    {
        if(!id)
        {
            id = New(v);
            return;
        }
        if(val[id] == v)
        {
            cnt[id]++;
        }
        else
        {
            int d = (v < val[id] ? 0 : 1);
            insert(ch[id][d], v);
            if(dat[ch[id][d]] > dat[id])
                rotate(id, d ^ 1);
        }
        pushup(id);
    }
    void remove(int &id, int v)
    {
        if(!id)
            return;
        if(v == val[id])
        {
            if(cnt[id] > 1)
            {
                cnt[id]--;
                pushup(id);
                return;
            }
            else
            {
                if(ch[id][0] || ch[id][1])
                {
                    if(!ch[id][1]  || dat[ch[id][0]] > dat[ch[id][1]])
                    {
                        rotate(id, 1);
                        remove(ch[id][1], v);
                    }
                    else
                    {
                        rotate(id, 0);
                        remove(ch[id][0], v);
                    }
                    pushup(id);
                }
                else
                {
                    id = 0;
                }
                return;
            }
        }
        v < val[id] ? remove(ch[id][0], v) : remove(ch[id][1], v);
        pushup(id);
    }
    //查询 M 中有多少个数比 x 小，并且将得到的答案加一。
    int getRank(int id,int v)
    {
        if(!id)
            return 1;
        if(v == val[id])
            return sz[ch[id][0]] + 1;
        else if(v < val[id])
            return getRank(ch[id][0], v);
        else
            return sz[ch[id][0]] + cnt[id] + getRank(ch[id][1], v);
    }
    //根据排名找数字
    int getVal(int id,int rank)
    {
        if(!id)
            return INF;
        if(rank <= sz[ch[id][0]])
            return getVal(ch[id][0], rank);
        if(rank <= sz[ch[id][0]] + cnt[id])
            return val[id];
        return getVal(ch[id][1],rank - sz[ch[id][0]] - cnt[id]);
    }
    //前驱（小于 x，且最大的数）。
    int getPre(int v)
    {
        int id = root,pre = -INF;
        while(id)
        {
            if(val[id] < v)
                pre = val[id], id = ch[id][1];
            else
                id = ch[id][0];
        }
        return pre;
    }
    //后继（大于 x，且最小的数）。
    int getNext(int v)
    {
        int id = root, nxt = INF;
        while(id)
        {
            if(val[id] > v)
                nxt = val[id], id = ch[id][0];
            else
                id = ch[id][1];
        }
        return nxt;
    }
};
int main()
{
    int n;
    cin >> n;
    Treap t(n);
    while(n--)
    {
        int op, x;
        cin >> op >> x;
        if(op == 1)
            t.insert(t.root, x);
        else if(op == 2)
            t.remove(t.root, x);
        else if(op == 3)
            cout << t.getRank(t.root, x) - 1<< "\n";
        else if(op == 4)
            cout << t.getVal(t.root, x + 1) << "\n";
        else if(op == 5)
            cout << t.getPre(x) << "\n";
        else
            cout << t.getNext(x) << "\n";
    }
}
```

#### 树状数组

```cpp
template<typename T>
struct Fenwick
{
    int n;
    vector<T> a;
    Fenwick(int n_ = 0)
    {
        init(n_);
    }
    void init(int n_)
    {
        n = n_;
        a.assign(n + 1, T{});
    }
    void add(int x,T v)
    {
        for (int i = x; i <= n;i += i & (-i))
        {
            a[i] += v;
        }
    }
    T sum(int x)
    {
        T ans{};
        for (int i = x; i > 0;i -= i & (-i))
        {
            ans += a[i];
        }
        return ans;
    }
    T rangeSum(int l,int r)
    {
        return sum(r) - sum(l - 1);
    }
    //select的功能是找到最大的位置 x，使得前缀和到x时 < k
    int select(const T &k)
    {
        int x = 0;
        T cur{};
        for (int i = 1 << __lg(n); i;i >>= 1)
        {
            if(x + i <= n && cur + a[x + i] <= k)
            {
                x += i;
                cur += a[x];
            }
        }
        return x;
    }
};
```

#### 线性基

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
template<class T>
void chmax(T &a, T b) 
{
    if (a < b) 
        a = b;
}
//i64
struct Basis
{
    vector<i64> a;// 基向量，a[i] 的最高位为 i
    vector<i64> t;// 时间戳，-1 表示空位
    bool zero = false;
    Basis()
    {
        a.resize(64, 0);
        t.resize(64, -1);//t[i] 的默认值 -1 表示该位尚未被占用
    }
    void add(i64 x, i64 y = 2e18)
    {
        for (int i = 63; i >= 0;i--)
        {
            if((x >> i) & 1)
            {
                if (y > t[i])
                {
                    swap(a[i], x);
                    swap(t[i], y);
                }
                x ^= a[i];
            }
        }
        if(x == 0)
            zero = true;
    }
    // 查询 x 能否由时间戳 ≥ y 的基向量表示
    bool query(i64 x, i64 y = 0)
    {
        for (int i = 63; i >= 0;i--)
        {
            if(((x >> i) & 1) && t[i] >= y)
                x ^= a[i];
        }
        return x == 0;
    }
    // 求最大异或和
    i64 getMax() {
        i64 res = 0;
        for (int i = 63; i >= 0; --i) {
            if ((res ^ a[i]) > res)  // 异或后变大则采用
                res ^= a[i];
        }
        return res;
    }
    i64 getMin()
    {
        if(zero)
            return 0;
        for (int i = 0; i <= 63;i++)
        {
            if(a[i])
                return a[i];
        }
        return 0;
    }
    //求第 k 小
    i64 getkth(i64 k)
    {
        if(zero)
        {
            if(k == 1)
                return 0;
            k--;//否则，将 k 减 1，后续只考虑非零的异或和，即第 2 小对应原来的第 1 个非零数，以此类推。
        }
        vector<i64> b = a;//复制，防止修改原数组
        vector<i64> tmp;
        for (int i = 0; i <= 63;i++)
        {
            for (int j = i - 1; j >= 0;j--)
            {
                //消元过程
                if((b[i] >> j) & 1)
                    b[i] ^= b[j];
                
            }
            if(b[i])//如果不为0
                tmp.push_back(b[i]);
        }
        i64 cnt = tmp.size();
        if(k >= (1ll << cnt))
            return -1;
        i64 res = 0;
        for (int i = 0; i < cnt;i++)
        {
            if((k >> i) & 1)
                res ^= tmp[i];
        }
        return res;
    }
};
```

#### Splay

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
struct Splay
{
    struct Node
    {
        int val, id, lazy, size;
        Node *ch[2];
        Node *parent;
        Node(int v, int idx = 0) : val(v), id(idx), lazy(0), size(1), ch{nullptr, nullptr}, parent(nullptr) {}
    };
    Node *root;
    Splay() : root(nullptr) {}
    ~Splay() { clear(root); }
    void clear(Node *t)
    {
        if(!t)
            return;
        clear(t->ch[0]);
        clear(t->ch[1]);
        delete t;
    }
    // ---------- 辅助函数 ----------    
    int getpos(Node* t) const
    {
        return t->parent ? (t->parent->ch[1] == t) : 0;
    }
    void pushup(Node* t)
    {
        if(!t)
            return;
        t->size = 1;
        if(t->ch[0])
            t->size += t->ch[0]->size;
        if(t->ch[1])
            t->size += t->ch[1]->size;
    }
    //执行加法
    void applytag(Node *t, int v)
    {
        if(!t)
            return;
        t->val += v;
        t->lazy += v;
    }
    void pushdown(Node *t)
    {
        if(!t || t->lazy == 0)
            return;
        if(t->ch[0])
            applytag(t->ch[0], t->lazy);
        if(t->ch[1])
            applytag(t->ch[1], t->lazy);
        t->lazy = 0;
    }
    // ---------- 旋转与伸展 ----------
    void rotate(Node *t)
    {
        Node *q = t->parent;
        int x = !getpos(t);
        q->ch[!x] = t->ch[x];
        if(t->ch[x])
            t->ch[x]->parent = q;
        t->parent = q->parent;
        if(q->parent)
            q->parent->ch[getpos(q)] = t;
        t->ch[x] = q;
        q->parent = t;
        pushup(q);
        pushup(t);
    }
    //伸展 (splay)：将指定节点通过旋转提升到根，沿途下传懒标记。
    void splay(Node *t)
    { 
        vector<Node *> stk;
        for (Node *i = t; i->parent; i = i->parent)
            stk.push_back(i->parent);
        while(!stk.empty())
        {
            pushdown(stk.back());
            stk.pop_back();
        }
        pushdown(t);
        while(t->parent)//只要 t 还不是根，就继续旋转。
        {
            if(t->parent->parent)
            {
                if(getpos(t) == getpos(t->parent))
                    rotate(t->parent);
                else
                    rotate(t);
            }
            rotate(t);
        }
        root = t;
    }
    //分裂（split）：以值 x 为界，将树分成 < x 和 >= x 两部分
    //pair第一个元素是左子树的根（值 < x），第二个元素是右子树的根（值 ≥ x）
    pair<Node*, Node*> split(Node *t, int x)
    {
        if(!t)
            return {nullptr, nullptr};
        Node *v = nullptr;
        Node *j = t;
        for (Node *i = t; i; )
        {
            pushdown(i); // 下传懒标记，确保当前值正确
            j = i;// 记录最后访问的节点
            if(i->val >= x)
            {
                v = i;// 记录第一个遇到的 ≥ x 的节点
                i = i->ch[0]; // 继续向左，寻找更小的 ≥ x 的节点
            }
            else
            {
                i = i->ch[1]; // 向右，因为当前值 < x，要找 ≥ x 只能向右
            }
        }
        splay(j);
        if(!v)//如果没找到
            return {j, nullptr};
        splay(v);
        Node *u = v->ch[0];//将 v 的左孩子 u 取出，这就是我们需要的左子树（所有 < x 的节点）
        if(u)
        {
            v->ch[0] = u->parent = nullptr;//断开 u 与 v 的连接
            pushup(v);//更新子树大小
        }
        return {u, v};
    }
    //合并（merge）：要求输入的左树的最大值 < 右树的最小值，否则合并后的树会破坏 BST 结构。
    Node* merge(Node *l,Node *r)
    {
        if(!l)
            return r;
        if(!r)
            return l;
        Node *i = l;
        while(i->ch[1])
            i = i->ch[1];
        Node *ck = r;
        while(ck->ch[0])
            ck = ck->ch[0];
        assert(i->val < ck->val && "Merge precondition violated: left max >= right min");
        splay(i);
        i->ch[1] = r;
        r->parent = i;
        pushup(i);
        return i;//返回合并后的根节点
    }
    // ---------- 基本操作 ----------
    //插入
    void insert(int val, int id = 0)
    {
        Node *x = new Node(val, id);
        if(!root)
        {
            root = x;
            return;
        }
        auto [L, R] = split(root, val);
        root = merge(merge(L, x), R);
    }
    //全部清除
    void eraseAll(int val)
    {
        if(!root)
            return;
        auto [L, MR] = split(root, val);
        auto [M, R] = split(MR, val + 1);
        if(M)
            clear(M);
        root = merge(L, R);
    }
    //只删除一个
    void eraseSingle(int val)
    {
        if(!root)
            return;
        auto [L, MR] = split(root, val);
        auto [M, R] = split(MR, val + 1);
        if(M)
        {
            Node *v = M;
            Node *l = v->ch[0];
            Node *r = v->ch[1];
            if(l)
                l->parent = nullptr;
            if(r)
                r->parent = nullptr;
            delete v;
            M = merge(l, r);
        }
        root = merge(merge(L, M), R);
    }
    //查找某个数是否存在
    bool find(int val)
    {
        auto [L, R] = split(root, val);
        bool ok = false;
        if(R && R->val == val)
            ok = true;
        root = merge(L, R);
        return ok;
    }
    //查询一个数从小往大排为第几个
    int rank(int val)
    {
        auto [L, R] = split(root, val);
        int res = (L ? L->size : 0) + 1;
        root = merge(L, R);
        return res;
    }
    //查询第k小的数
    int kth(int k)
    {
        assert(root && k >= 1 && k <= root->size);
        Node *t = root;//从根节点开始
        while(t)
        {
            pushdown(t);//先调用 pushdown(t) 下传懒标记，保证左右子树的 size 和节点值准确。
            int lsz = t->ch[0] ? t->ch[0]->size : 0;//获取左子树大小
            if(k <= lsz)
                t = t->ch[0];//说明此时到左子树去找
            else if(k == lsz + 1)//说明当前节点 t 就是第 k 小的节点。
            {
                splay(t);
                return t->val;
            }
            else//在右子树，相应的去找就行
            {
                k -= lsz + 1;
                t = t->ch[1];
            }
        }
        return -1;//一般不可能在这里return，while循环里就return完了
    }
    //返回整个树的大小
    int size() const
    {
        return root ? root->size : 0;
    }
    // //区间加法
    // //这里l ，r代表的是真实数值，不是下标
    // void rangeAdd(int l, int r, int delta)
    // {
    //     if(l > r)
    //         return;
    //     auto [L, MR] = split(root, l);
    //     auto [M, R] = split(MR, r + 1);
    //     if(M)
    //         applytag(M, delta);//将 M 根节点的值增加 delta（t->val += delta）。并将 M 根节点的懒标记累加 delta（t->lazy += delta）。
    //     root = merge(merge(L, M), R);//复原
    // }
    //做中序遍历
    void inOrder(Node *t, vector<int> &out)
    {
        if(!t)
            return;
        pushdown(t);
        inOrder(t->ch[0], out);
        out.push_back(t->val);
        inOrder(t->ch[1], out);
    }
    //对所有> x的执行add操作
    // >= x的情况自己微调
    void add(int x, int addval)
    {
        auto [L, MR] = split(root, x);
        auto [M, R] = split(MR, x + 1);
        if(R)
            applytag(R, x);
        
        root = merge(merge(L, M), R);
    }
    //这个是special Add,在一组数插入之前就执行add，add 那些>=x的树完再插入
    void spe(int x, int id)
    {
        auto [L, R] = split(root, x);
        if(R)
            applytag(R, x);
        Node *node = new Node(x, id);
        Node *Lnode = merge(L, node);
        root = merge(Lnode, R);

        splay(node);
    }
    //对所有< x的执行minus操作
    void minus(int x,int mival)
    {
        auto [L, R] = split(root, x);
        if(L)
            applytag(L, -mival);        
        root = merge(L, R);
    }
    void print()
    {
        vector<int> vals;
        inOrder(root, vals);
        for(int v : vals)
            cout << v << " ";
        cout << "\n";
    }
    void debugPrint()
    {
        vector<int> vals;
        inOrder(root, vals);
        for(int v : vals)
            cerr << v << " ";
        cerr << "\n";
    }
};
```

#### ST表

```cpp
//1.求区间最大值 (Max)
// STable st_max(a, [](int x, int y) { return max(x, y); }); 
// 2. 求区间最小值 (Min)
// 3. 求区间最大公约数 (GCD)
//4. 求区间按位与 (Bitwise AND)
// 5. 求区间按位或 (Bitwise OR) 
// ST 表能够工作的一个绝对前提是，操作必须满足可重复贡献性质（Idempotence）。
template<typename T, typename F>
struct STable
{
    int n;
    int maxlog;
    F func;
    // st[i][j] 表示从 i 开始，长度为 2^j 的区间内的最大值
    vector<vector<T>> st;
    //a 1 - index
    STable(const vector<T>& a,const F& f) : func(f)
    {
        n = a.size() - 1;//a[0]废弃了，size - 1
        // __lg(x) 是编译器内置函数，用来求 x 最高位 1 的索引，等价于向下取整的 log2(x)
        maxlog = __lg(n) + 1;
        st.assign(n + 1, vector<T>(maxlog));
        for (int i = 1; i <= n;i++)
            st[i][0] = a[i];
        for (int j = 1; j < maxlog;j++)
        {
            int len = 1 << (j - 1);//小区间的长度
            for (int i = 1;i <= n - (1 << j) + 1;i++)
                st[i][j] = func(st[i][j - 1], st[i + len][j - 1]);//由i的两个子区间合并上来
        }
    }
    inline T query(int l,int r) const
    {
        if (l > r) 
            swap(l, r);
        int k = __lg(r - l + 1);
        return func(st[l][k], st[r - (1 << k) + 1][k]);
    }
};

```

#### 线段树 基础区间加乘

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
int P = 998244353;
struct SegmentTree
{
    int n;
    vector<int> mulTag, addTag, sum;
    SegmentTree(int n_) : n{n_}, mulTag(4 * n + 1, 1), addTag(4 * n + 1, 0), sum(4 * n + 1) {}
    void pull(int p)
    {
        sum[p] = (sum[2 * p] + sum[2 * p + 1]) % P;
    }
    void mul(int p,int v)
    {
        mulTag[p] = 1ll * mulTag[p] * v % P;
        addTag[p] = 1ll * addTag[p] * v % P;
        sum[p] = 1ll * sum[p] * v % P;
    }
    void push(int p,int l,int r)
    {
        if(mulTag[p] != 1)
        {
            mul(2 * p, mulTag[p]);
            mul(2 * p + 1,mulTag[p]);
            mulTag[p] = 1;
        }
        if(addTag[p] != 0)
        {
            int m = l + (r - l) / 2;
            applyAdd(2 * p, l, m, addTag[p]);
            applyAdd(2 * p + 1, m + 1, r, addTag[p]);
            addTag[p] = 0;
        }
    }
    int rangeQuery(int p,int l,int r,int x,int y)
    {
        if(l > y || r < x)
            return 0;
        if(l >= x && r <= y)
            return sum[p];
        int m = l + (r - l) / 2;
        push(p, l, r);
        return (rangeQuery(2 * p, l, m, x, y) % P + rangeQuery(2 * p + 1, m + 1, r, x, y) % P);
    }
    int rangeQuery(int x,int y)
    {
        return rangeQuery(1, 1, n, x, y) % P;
    }
    void rangeMul(int p,int l,int r,int x,int y,int v)
    {
        if(l > y || r < x)
            return;
        if(l >= x && r <= y)
            return mul(p, v);
        int m = l + (r - l) / 2;
        push(p, l, r);
        rangeMul(2 * p, l, m, x, y, v);
        rangeMul(2 * p + 1, m + 1, r, x, y, v);
        pull(p);
    }
    void rangeMul(int x,int y,int v)
    {
        rangeMul(1, 1, n, x, y, v);
    }
    void applyAdd(int p,int l,int r,int v)
    {
        addTag[p] = (1ll * addTag[p] + 1ll * v) % P;
        sum[p] = (1ll * sum[p] + 1ll * (r - l + 1) * v) % P;
    }
    void rangeAdd(int p,int l,int r,int x,int y,int v)
    {
        if(l > y || r < x)
            return;
        if(l >= x && r <= y)
        {
            applyAdd(p, l, r, v);
            return;
        }
        int m = l + (r - l) / 2;
        push(p, l, r);
        rangeAdd(2 * p, l, m, x, y, v);
        rangeAdd(2 * p + 1, m + 1, r, x, y, v);
        pull(p);
    }
    void rangeAdd(int x,int y,int v)
    {
        rangeAdd(1, 1, n, x, y, v);
    }
};
```

#### 线段树区间最大最小值

```cpp
#include<iostream>
using namespace std;
int n, m;
struct ty {
    int maxn, minn, num;
}tree[4000010];
int a[1000010];
void build(int p,int l,int r) {
    if (l == r) {
        tree[p].maxn = a[l];
        tree[p].minn = a[l];
        tree[p].num = 1;
        return;
    }
    int mid = (l + r) / 2;
    build(2 * p, l, mid);
    build(2 * p + 1, mid + 1, r);
    tree[p].maxn = max(tree[2 * p].maxn, tree[2 * p + 1].maxn);
    tree[p].minn = min(tree[2 * p].minn, tree[2 * p + 1].minn);
    tree[p].num = tree[2 * p].num + tree[2 * p + 1].num;
}
int find(int p,int l,int r,int x) {
    if (l == r) {
        return l;
    }
    int mid = (l + r) / 2;
    if (tree[2 * p].num >= x)return find(2 * p, l, mid, x);
    else return find(2 * p + 1, mid + 1, r, x - tree[2 * p].num);
}
void del(int p,int l,int r,int x) {
    if (l == r) {
        tree[p].maxn = -1e9 - 10;
        tree[p].minn = 1e9 + 10;
        tree[p].num = 0;
        return;
    }
    int mid = (l + r) / 2;
    if (x <= mid)del(2 * p, l, mid, x);
    else del(2 * p + 1, mid + 1, r, x);
    tree[p].maxn = max(tree[2 * p].maxn, tree[2 * p + 1].maxn);
    tree[p].minn = min(tree[2 * p].minn, tree[2 * p + 1].minn);
    tree[p].num = tree[2 * p].num + tree[2 * p + 1].num;
}
ty cal(int p, int l, int r, int x, int y) {
    if (x <= l && r <= y) {
        return tree[p];
    }
    int mid = (l + r) / 2;
    if (y <= mid)return cal(2 * p, l, mid, x, y);
    if (x >= mid + 1)return cal(2 * p + 1, mid + 1, r, x, y);
    ty t1= cal(2 * p, l, mid, x, y);
    ty t2= cal(2 * p + 1, mid + 1, r, x, y);
    t1.maxn = max(t1.maxn, t2.maxn);
    t1.minn = min(t1.minn, t2.minn);
    return t1;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(0);
    cin >> n >> m;
    for (int i = 1; i <= n; ++i)cin >> a[i];
    build(1, 1, n);
    for (int i = 1; i <= m; ++i) {
        int op, x, y;
        cin >> op;
        if (op == 1) {
            cin >> x;
            x = find(1, 1, n, x);
            del(1, 1, n, x);
        }
        else {
            cin >> x >> y;
            x = find(1, 1, n, x);
            y = find(1, 1, n, y);
            ty tem = cal(1, 1, n, x, y);
            cout << tem.minn << " " << tem.maxn << endl;
        }
    }
}
```



#### 线段树区间平方和

```cpp
#include<iostream>
using namespace std;
#define ll long long
int n, m;
ll a[10040];
ll sum1[40040];
ll sum2[40040];
ll lazy1[40040];
ll lazy2[40040];
void build(int p, int l, int r) {
    if (l == r) {
        sum1[p] = a[l];
        sum2[p] = a[l] * a[l];
        return;
    }
    int mid = (l + r) / 2;
    build(2 * p, l, mid);
    build(2 * p + 1, mid + 1, r);
    sum1[p] = sum1[2 * p] + sum1[2 * p + 1];
    sum2[p] = sum2[2 * p] + sum2[2 * p + 1];
}
void push(int p, int l, int r) {
    int mid = (l + r) / 2;
    lazy1[2 * p] *= lazy1[p];
    sum1[2*p] *= lazy1[p];
    sum2[2*p] *= lazy1[p] * lazy1[p];
    lazy2[2 * p] += lazy2[p];
    sum2[2*p] += (mid - l + 1) * lazy2[p] * lazy2[p] + 2 * sum1[2*p] * lazy2[p];
    sum1[2*p] += lazy2[p]*(mid-l+1);
    lazy1[2 * p + 1] *= lazy1[p];
    sum1[2 * p + 1] *= lazy1[p];
    sum2[2 * p + 1] *= lazy1[p] * lazy1[p];
    lazy2[2 * p + 1] += lazy2[p];
    sum2[2 * p + 1] += (r - (mid + 1) + 1) * lazy2[p] * lazy2[p] + 2 * sum1[2*p+1] * lazy2[p];
    sum1[2 * p + 1] += lazy2[p]*(r-(mid+1)+1);
    lazy1[p] = 1, lazy2[p] = 0;
}
void change1(int p, int l, int r, int x, int y, int num) {
    if (x <= l && r <= y) {
        lazy1[p] *= num;
        lazy2[p] *= num;
        sum1[p] *= num;
        sum2[p] *= num * num;
        return;
    }
    push(p,l,r);
    int mid = (l + r) / 2;
    if (x <= mid)change1(2*p, l, mid, x, y, num);
    if (y >= mid + 1)change1(2*p+1, mid + 1, r, x, y, num);
    sum1[p] = sum1[2 * p] + sum1[2 * p + 1];
    sum2[p] = sum2[2 * p] + sum2[2 * p + 1];
}
void change2(int p, int l, int r, int x, int y, int num) {
    if (x <= l && r <= y) {
        lazy2[p] += num;
        sum2[p] += (r - l + 1) * num * num + 2 * sum1[p] * num;
        sum1[p] += num * (r - l + 1);
        return;
    }
    push(p, l, r);
    int mid = (l + r) / 2;
    if (x <= mid)change2(2*p, l, mid, x, y, num);
    if (y >= mid + 1)change2(2*p+1, mid + 1, r, x, y, num);
    sum1[p] = sum1[2 * p] + sum1[2 * p + 1];
    sum2[p] = sum2[2 * p] + sum2[2 * p + 1];
}

ll cal1(int p, int l ,int r, int x, int y) {
    if (x <= l && r <= y) {
        return sum1[p];
    }
    push(p,l,r);
    int mid = (l + r) / 2;
    ll ans = 0;
    if (x <= mid)ans += cal1(2*p, l, mid, x, y);
    if (y >= mid + 1)ans += cal1(2*p+1, mid + 1, r, x, y);
    return ans;
}
ll cal2(int p, int l, int r, int x, int y) {
    if (x <= l && r <= y) {
        return sum2[p];
    }
    push(p, l, r);
    int mid = (l + r) / 2;
    ll ans = 0;
    if (x <= mid)ans += cal2(2*p, l, mid, x, y);
    if (y >= mid + 1)ans += cal2(2*p+1, mid + 1, r, x, y);
    return ans;
}
int main() {
    for (int i = 1; i <= 40000; ++i)lazy1[i] = 1, lazy2[i] = 0;
    cin >> n >> m;
    for (int i = 1; i <= n; ++i)cin >> a[i];
    build(1, 1, n);
    for (int i = 1; i <= m; ++i) {
        int op, l, r, x;
        cin >> op;
        if (op == 1) {
            cin >> l >> r;
            cout << cal1(1,1,n,l, r) << endl;
        }
        else if (op == 2) {
            cin >> l >> r;
            cout << cal2(1,1,n,l, r) << endl;
        }
        else if (op == 3) {
            cin >> l >> r >> x;
            change1(1, 1, n, l, r, x);
        }
        else {
            cin >> l >> r >> x;
            change2(1, 1, n, l, r, x);
        }
    }
}
```

#### 最近公共祖先

```cpp
	int n, m, s;
    cin >> n >> m >> s;
    vector<vector<int>> adj(n + 1);
    vector<vector<int>> fa(n + 1, vector<int>(32, 0));
    vector<int> dep(n + 1, 0);
    for (int i = 1; i < n;i++)
    {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    auto dfs = [&](auto self, int u, int pa) -> void
    {
        dep[u] = dep[pa] + 1;
        fa[u][0] = pa;
        for (int i = 1; i <= 31;i++)
            fa[u][i] = fa[fa[u][i - 1]][i - 1];
        for(int v : adj[u])
        {
            if(v != pa)
                self(self, v, u);
        }
    };
    dep[0] = 0;
    dfs(dfs, s, 0);
    auto lca = [&](int u, int v) -> int 
    {
        if(dep[u] < dep[v])
            swap(u, v);
        for (int i = 31; i >= 0;i--)
        {
            if(dep[fa[u][i]] >= dep[v])
                u = fa[u][i];
        }
        if(u == v)
            return v;
        for (int i = 31; i >= 0;i--)
        {
            if(fa[u][i] != fa[v][i])
            {
                u = fa[u][i];
                v = fa[v][i];
            }
        }
        return fa[u][0];
    };
    for (int i = 0; i < m;i++)
    {
        int a, b;
        cin >> a >> b;
        cout << lca(a, b) << "\n";
    }	
```

### 数论，几何，多项式

#### 高斯消元

```cpp
#include <bits/stdc++.h>
using namespace std;
using db = double;
struct Gauss
{
    static constexpr db EPS = 1e-8;
    //a n * (n + 1)
    static int solve(vector<vector<db>> &a,vector<db> &res)
    {
        int n = a.size();
        int r = 0;// r 记录当前主元要放的行数，也代表矩阵的秩
        for (int i = 0; i < n;i++)
        {
            int maxrow = r;
            for (int j = r + 1; j < n;j++)
            {
                if(abs(a[j][i]) > abs(a[maxrow][i]))
                    maxrow = j;
            }
            if(abs(a[maxrow][i]) < EPS)
                continue;// 注意：这里跳过这一列，r 不增加！
            swap(a[r], a[maxrow]);
            db pivot = a[i][i];
            for (int j = i; j <= n;j++)
                a[i][j] /= pivot;
            for (int j = 0; j < n;j++)
            {
                if(i != j)
                {
                    db factor = a[j][i];
                    for (int k = i; k <= n;k++)
                        a[j][k] -= factor * a[i][k];
                }
            }
            r++;
        }
        if(r < n)// 不满秩，说明有自由变量或者矛盾
        {
            for (int i = r; i < n;i++)
            {
                if(abs(a[i][n]) > EPS)
                    return -1;// 无解
            }
            return 0;// 0 = 0，无穷多解
        }
        res.resize(n);
        for (int i = 0; i < n;i++)
            res[i] = a[i][n];
        return 1;
    }
};
```

#### 矩阵快速幂

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
const int MOD = 1e9 + 7;
struct Matrix
{
    int n;
    vector<vector<i64>> mat;
    Matrix(int _n) : n(_n)
    {
        mat.assign(n, vector<i64>(n, 0));
    }
    void init()
    {
        for (int i = 0; i < n;i++)
            mat[i][i] = 1;
    }
    Matrix operator*(const Matrix &other) const
    {
        Matrix res(n);
        for (int i = 0; i < n;i++)
        {
            for (int k = 0; k < n;k++)
            {
                i64 r = mat[i][k];
                if(r == 0)
                    continue;// 剪枝：如果是 0 就没必要去乘这一整行了
                for (int j = 0; j < n;j++)
                {
                    res.mat[i][j] = (res.mat[i][j] + r * other.mat[k][j]) % MOD;
                }
            }
        }
        return res;
    }
    static Matrix qpow(Matrix a, i64 k)
    {
        Matrix res(a.n);
        res.init();
        while(k > 0)
        {
            if(k & 1)
                res = res * a;
            a = a * a;
            k >>= 1;
        }
        return res;
    }
};
```

#### EXGCD

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
using i128 = __int128;
ostream &operator<<(ostream &os, i128 n) {
    string s;
    if(n == 0)
        s = "0";
    if(n < 0)
    {
        s += "-";
        n = -n;
    }
    while (n) {
        s += '0' + n % 10;
        n /= 10;
    }
    reverse(s.begin(), s.end());
    return os << s;
}
istream &operator>>(istream &is,i128& n)
{
    n = 0;
    string s;
    is >> s;
    for (int i = 0; i < s.size();i++)
    {
        n = n * 10 + s[i] - '0';
    }
    return is;
}
struct exgcd
{
    struct result
    {
        i128 x, y, g;
        bool f;
    };
    //ExGCD 找到通解公式
    // 求解 ax + by = c
    // 返回结构体包含一组特解 x, y，最大公约数 g，以及是否有解
    //对于static来说,可以通过exgcd::使用命名空间直接调用而不用创建实例
    static result solve(i64 a,i64 b,i64 c)
    {
        i128 x = 1, y = 0, g = a;
        function<void(i64, i64)> dfs = [&](i64 a, i64 b)
        {
            if(b == 0)
            {
                g = a;
                x = 1, y = 0;
                return;
            }
            dfs(b, a % b);
            i128 tp = x;
            x = y;//更新x
            y = tp - (i128)(a / b) * y;//更新y
        };
        dfs(a, b);
        if(g < 0)//保证最大公约数为正的
        {
            g = -g;
            x = -x;
            y = -y;
        }
        if(c % g)//如果gcd(a,b)不能整除c,说明无解
        {
            return {0, 0, g, false};
        }
        i128 factor = c / g;
        return {x * factor, y * factor, g, true};
    }
    //获取 x 的最小非负整数解
    //返回 {x_min, g}，若无解返回 {-1, -1}，这里的g是gcd(a,b)
    //ax + by = c
    static pair<i128,i64> minx(i64 a,i64 b,i64 c)
    {
        result res = solve(a, b, c);
        if(!res.f)
            return {-1, -1}
        if(c == 0)
            return {0, (i64)res.g};
        i128 bg = b / res.g;
        if(bg < 0)
            bg = -bg;
        i128 k = -res.x / bg;
        while(res.x + k * bg < 0)
            k++;
        while(res.x + (k - 1) * bg >= 0)
            k--;
        i128 x = res.x + k * bg;
        return {x, (i64)res.g};
    }
};
```

#### 欧拉筛

```cpp
#include <bits/stdc++.h>
using namespace std;
vector<int> primes,isPrime;
void sieve(int n)
{
	isPrime.assign(n + 1, 1);
	isPrime[1] = 0;
	for (int i = 2; i <= n; ++i)
	{
		if (isPrime[i])
			primes.push_back(i);
		for (auto p : primes)
		{
			if(i * p > n)
				break;
			isPrime[i * p] = 0;
			if(i % p == 0)
				break;
		}
	}
}
```

#### 欧拉函数

```cpp
//欧拉函数，表示小于等于 n 且与 n 互质的正整数个数。
#include <bits/stdc++.h>
using namespace std;
int phi(int n)
{
    int res = n;
    for (int i = 2; i * i <= n;i++)
    {
        if(n % i == 0)
        {
            while(n % i == 0)
                n /= i;
            res = res / i * (i - 1);
        }
    }
    if(n > 1)
        res = res / n * (n - 1);
    return res;
}
```

#### 求逆元

```cpp
#include <bits/stdc++.h>
using namespace std;
//exgcd求法
template<class T>
T exgcd(T a,T b,T &x,T &y)
{
    if(b == 0)
    {
        x = 1;
        y = 0;
        return a;
    }
    T d = exgcd(b, a % b, y, x);
    y = y - (a / b) * x;
    return d;
}
//求a在模m下的逆元
template<class T> 
T inv1(T a,T m)
{
    T x, y;
    T g = exgcd(a, m, x, y);
    if(g != 1)
        return -1;
    return (x % m + m) % m;
} 
//快速幂，仅限模数为质数
template<class T>
T qpow(T a,T b,T MOD)
{
    T res = 1;
    a %= MOD;
    while(b)
    {
        if(b & 1)
            res = res * a % MOD;
        a = a * a % MOD;
        b >>= 1;
    }
    return res % MOD;
}
template <class T>
T inv2(T a,T p)
{
    return qpow(a, p - 2, p);
}
//线性求逆元
vector<int> inv;
void invarr(int n,int p)
{
    inv.assign(n + 5, 0);
    inv[1] = 1;
    for (int i = 2; i <= n;i++)
        inv[i] = 1ll * (p - p / i) * inv[p % i] % p;
}
```

#### 自动取模运算

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
template<class T>
constexpr T qpow(T a,i64 b)
{
    T res = 1;
    while(b)
    {
        if(b & 1)
            res = res * a;
        a = a * a;
        b >>= 1;
    }
    return res;
}
constexpr i64 mul(i64 a, i64 b, i64 p) {
    i64 res = a * b - i64(1.L * a * b / p) * p; 
    res %= p;
    if (res < 0) res += p;
    return res;
}
template<i64 P>
struct MLong
{
    i64 x;
    constexpr MLong() : x{} {}
    constexpr MLong(i64 x) : x{norm(x % getMod())} {}
    static i64 Mod;
    constexpr static i64 getMod()
    {
        if(P > 0)
            return P;
        else
            return Mod;
    }
    constexpr static void setMod(i64 Mod_)
    {
        Mod = Mod_;
    }
    constexpr i64 norm(i64 x) const
    {
        if(x < 0)
            x += getMod();
        if(x >= getMod())
            x -= getMod();
        return x;
    }
    constexpr i64 val() const
    {
        return x;
    }
    explicit constexpr operator i64() const 
    {
        return x;
    }
    constexpr MLong operator-() const
    {
        MLong res;
        res.x = norm(getMod() - x);
        return res;
    }
    constexpr MLong inv() const
    {
        assert(x != 0);
        return qpow(*this, getMod() - 2);
    }
    constexpr MLong &operator*=(MLong rhs) & 
    {
        x = mul(x, rhs.x, getMod());
        return *this;
    }
    constexpr MLong &operator+=(MLong rhs) &
    {
        x = norm(x + rhs.x);
        return *this;
    }
    constexpr MLong &operator-=(MLong rhs) & 
    {
        x = norm(x - rhs.x);
        return *this;
    }
    constexpr MLong &operator/=(MLong rhs) &
    {
        return *this *= rhs.inv();
    }
    friend constexpr MLong operator*(MLong lhs, MLong rhs) 
    {
        MLong res = lhs;
        res *= rhs;
        return res;
    }
    friend constexpr MLong operator+(MLong lhs, MLong rhs) 
    {
        MLong res = lhs;
        res += rhs;
        return res;
    }
    friend constexpr MLong operator-(MLong lhs, MLong rhs) 
    {
        MLong res = lhs;
        res -= rhs;
        return res;
    }
    friend constexpr MLong operator/(MLong lhs, MLong rhs) 
    {
        MLong res = lhs;
        res /= rhs;
        return res;
    }
    friend constexpr istream &operator>>(istream &is,MLong &a)
    {
        i64 v;
        is >> v;
        a = MLong(v);
        return is;
    }
    friend constexpr ostream &operator<<(ostream &os,MLong &a)
    {
        return os << a.val();
    }
    friend constexpr bool operator==(MLong lhs,MLong rhs)
    {
        return lhs.val == rhs.val();
    }
    friend constexpr bool operator!= (MLong lhs,MLong rhs)
    {
        return lhs.val() != rhs.val();
    }
};
template <>
i64 MLong<0ll>::Mod = (i64)1e18 + 9;
template<int P>
struct MInt
{
    int x;
    constexpr MInt() : x{} {}
    constexpr MInt(i64 x) : x{norm(x % getMod())} {}
    static int Mod;
    constexpr static int getMod()
    {
        if(P > 0)
            return P;
        else
            return Mod;
    }
    constexpr static void setMod(int Mod_)
    {
        Mod = Mod_;
    }
    constexpr int norm(int x) const 
    {
        if (x < 0) {
            x += getMod();
        }
        if (x >= getMod()) {
            x -= getMod();
        }
        return x;
    }
    constexpr int val() const 
    {
        return x;
    }
    explicit constexpr operator int() const 
    {
        return x;
    }
    constexpr MInt operator-() const 
    {
        MInt res;
        res.x = norm(getMod() - x);
        return res;
    }
    constexpr MInt inv() const 
    {
        assert(x != 0);
        return qpow(*this, getMod() - 2);
    }
    constexpr MInt &operator*=(MInt rhs) & 
    {
        x = 1LL * x * rhs.x % getMod();
        return *this;
    }
    constexpr MInt &operator+=(MInt rhs) & 
    {
        x = norm(x + rhs.x);
        return *this;
    }
    constexpr MInt &operator-=(MInt rhs) & 
    {
        x = norm(x - rhs.x);
        return *this;
    }
    constexpr MInt &operator/=(MInt rhs) & 
    {
        return *this *= rhs.inv();
    }
    friend constexpr MInt operator*(MInt lhs, MInt rhs) 
    {
        MInt res = lhs;
        res *= rhs;
        return res;
    }
    friend constexpr MInt operator+(MInt lhs, MInt rhs) 
    {
        MInt res = lhs;
        res += rhs;
        return res;
    }
    friend constexpr MInt operator-(MInt lhs, MInt rhs) 
    {
        MInt res = lhs;
        res -= rhs;
        return res;
    }
    friend constexpr MInt operator/(MInt lhs, MInt rhs) 
    {
        MInt res = lhs;
        res /= rhs;
        return res;
    }
    friend constexpr std::istream &operator>>(std::istream &is, MInt &a) 
    {
        i64 v;
        is >> v;
        a = MInt(v);
        return is;
    }
    friend constexpr std::ostream &operator<<(std::ostream &os, const MInt &a) 
    {
        return os << a.val();
    }
    friend constexpr bool operator==(MInt lhs, MInt rhs) 
    {
        return lhs.val() == rhs.val();
    }
    friend constexpr bool operator!=(MInt lhs, MInt rhs) 
    {
        return lhs.val() != rhs.val();
    }
};
template<>
int MInt<0>::Mod = 998244353;
constexpr int P = 998244353;
using Z = MInt<P>;
int main()
{
    i64 nr;
    cin >> nr;
    Z n = nr;
    Z sum_i = n * (n + 1) / 2;
    Z sum_i2 = n * (n + 1) * (2 * n + 1) / 6;
    Z sum_const = Z(2) * n;
    Z ans = sum_i2 + Z(3) * sum_i + sum_const;
    cout << ans / n;
}
```

#### 组合数

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
template<class T>
constexpr T qpow(T a,i64 b)
{
    T res = 1;
    while(b)
    {
        if(b & 1)
            res = res * a;
        a = a * a;
        b >>= 1;
    }
    return res;
}
constexpr i64 mul(i64 a, i64 b, i64 p) {
    i64 res = a * b - i64(1.L * a * b / p) * p; 
    res %= p;
    if (res < 0) res += p;
    return res;
}
struct MLong
{
    i64 x;
    constexpr MLong() : x{} {}
    constexpr MLong(i64 x) : x{norm(x % getMod())} {}
    static i64 Mod;
    constexpr static i64 getMod()
    {
        if(P > 0)
            return P;
        else
            return Mod;
    }
    constexpr static void setMod(i64 Mod_)
    {
        Mod = Mod_;
    }
    constexpr i64 norm(i64 x) const
    {
        if(x < 0)
            x += getMod();
        if(x >= getMod())
            x -= getMod();
        return x;
    }
    constexpr i64 val() const
    {
        return x;
    }
    explicit constexpr operator i64() const 
    {
        return x;
    }
    constexpr MLong operator-() const
    {
        MLong res;
        res.x = norm(getMod() - x);
        return res;
    }
    constexpr MLong inv() const
    {
        assert(x != 0);
        return qpow(*this, getMod() - 2);
    }
    constexpr MLong &operator*=(MLong rhs) & 
    {
        x = mul(x, rhs.x, getMod());
        return *this;
    }
    constexpr MLong &operator+=(MLong rhs) &
    {
        x = norm(x + rhs.x);
        return *this;
    }
    constexpr MLong &operator-=(MLong rhs) & 
    {
        x = norm(x - rhs.x);
        return *this;
    }
    constexpr MLong &operator/=(MLong rhs) &
    {
        return *this *= rhs.inv();
    }
    friend constexpr MLong operator*(MLong lhs, MLong rhs) 
    {
        MLong res = lhs;
        res *= rhs;
        return res;
    }
    friend constexpr MLong operator+(MLong lhs, MLong rhs) 
    {
        MLong res = lhs;
        res += rhs;
        return res;
    }
    friend constexpr MLong operator-(MLong lhs, MLong rhs) 
    {
        MLong res = lhs;
        res -= rhs;
        return res;
    }
    friend constexpr MLong operator/(MLong lhs, MLong rhs) 
    {
        MLong res = lhs;
        res /= rhs;
        return res;
    }
    friend constexpr istream &operator>>(istream &is,MLong &a)
    {
        i64 v;
        is >> v;// 1. 先从流中读入一个普通的 long long (v)
        a = MLong(v);// 2. 利用构造函数把 v 包装成 MLong 类型（会自动取模）
        return is;// 3. 把流原样返回
    }
    friend constexpr ostream &operator<<(ostream &os,MLong &a)
    {
        return os << a.val();
    }
    friend constexpr bool operator==(MLong lhs,MLong rhs)
    {
        return lhs.val() == rhs.val();
    }
    friend constexpr bool operator!= (MLong lhs,MLong rhs)
    {
        return lhs.val() != rhs.val();
    }
};
template <>
i64 MLong<0ll>::Mod = (i64)1e18 + 9;
template<int P>
struct MInt
{
    int x;
    constexpr MInt() : x{} {}
    constexpr MInt(i64 x) : x{norm(x % getMod())} {}

    static int Mod;
    constexpr static int getMod()
    {
        if(P > 0)
            return P;
        else
            return Mod;
    }
    constexpr static void setMod(int Mod_)
    {
        Mod = Mod_;
    }
    constexpr int norm(int x) const 
    {
        if (x < 0) {
            x += getMod();
        }
        if (x >= getMod()) {
            x -= getMod();
        }
        return x;
    }
    constexpr int val() const 
    {
        return x;
    }
    explicit constexpr operator int() const 
    {
        return x;
    }
    constexpr MInt operator-() const 
    {
        MInt res;
        res.x = norm(getMod() - x);
        return res;
    }
    constexpr MInt inv() const 
    {
        assert(x != 0);
        return qpow(*this, getMod() - 2);
    }
    constexpr MInt &operator*=(MInt rhs) & 
    {
        x = 1LL * x * rhs.x % getMod();
        return *this;
    }
    constexpr MInt &operator+=(MInt rhs) & 
    {
        x = norm(x + rhs.x);
        return *this;
    }
    constexpr MInt &operator-=(MInt rhs) & 
    {
        x = norm(x - rhs.x);
        return *this;
    }
    constexpr MInt &operator/=(MInt rhs) & 
    {
        return *this *= rhs.inv();
    }
    friend constexpr MInt operator*(MInt lhs, MInt rhs) 
    {
        MInt res = lhs;
        res *= rhs;
        return res;
    }
    friend constexpr MInt operator+(MInt lhs, MInt rhs) 
    {
        MInt res = lhs;
        res += rhs;
        return res;
    }
    friend constexpr MInt operator-(MInt lhs, MInt rhs) 
    {
        MInt res = lhs;
        res -= rhs;
        return res;
    }
    friend constexpr MInt operator/(MInt lhs, MInt rhs) 
    {
        MInt res = lhs;
        res /= rhs;
        return res;
    }
    friend constexpr std::istream &operator>>(std::istream &is, MInt &a) 
    {
        i64 v;
        is >> v;
        a = MInt(v);
        return is;
    }
    friend constexpr std::ostream &operator<<(std::ostream &os, const MInt &a) 
    {
        return os << a.val();
    }
    friend constexpr bool operator==(MInt lhs, MInt rhs) 
    {
        return lhs.val() == rhs.val();
    }
    friend constexpr bool operator!=(MInt lhs, MInt rhs) 
    {
        return lhs.val() != rhs.val();
    }
};
template<>
int MInt<0>::Mod = 998244353;
template<int V, int P>
constexpr MInt<P> CInv = MInt<P>(V).inv();
constexpr int P = 998244353;
using Z = MInt<P>;
struct Comb
{
    int n;
    vector<Z> _fac;//存储阶乘（Factorial）
    vector<Z> _invfac;//存储阶乘的逆元（Inverse Factorial）
    vector<Z> _inv;//存储单个数字的逆元（Inverse）
    Comb() : n{0}, _fac{1}, _invfac{1},_inv{0} {}
    Comb(int n) : Comb()
    {
        init(n);
    }
    void init(int m)
    {
        m = min(m, Z::getMod() - 1);
        if(m <= n)
            return;
        _fac.resize(m + 1);
        _invfac.resize(m + 1);
        _inv.resize(m + 1);

        for (int i = n + 1; i <= m;i++)
        {
            _fac[i] = _fac[i - 1] * i;
        }
        _invfac[m] = _fac[m].inv();// 唯一一次快速幂先算出最大数 m 的逆元。然后倒着推
        for (int i = m; i > n;i--)
        {
            _invfac[i - 1] = _invfac[i] * i;
            _inv[i] = _invfac[i] * _fac[i - 1];
        }
        n = m;
    }
    Z fac(int m)
    {
        if(m > n)
            init(2 * m);
        return _fac[m];
    }
    Z invfac(int m)
    {
        if(m > n)
            init(2 * m);
        return _invfac[m];
    }
    Z inv(int m)
    {
        if(m > n)
            init(2 * m);
        return _inv[m];
    }
    Z binom(int n,int m)
    {
        if(n < m || m < 0)
            return 0;
        return fac(n) * invfac(m) * invfac(n - m);
    }
};
```

### 图论

#### 强分量缩点

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long
//dfn (DFS Number)：时间戳数组。记录每个节点在 DFS 遍历时第一次被访问到的顺序（第几个被发现的）。
// low (Lowest value)：追溯值数组。记录当前节点通过它的邻居（包括后代），能够“绕”回到的最早的时间戳（你能回到的最早祖先是谁）。
//bel (Belong)：归属数组。这就是缩点后的结果！它记录了原图中的每个点，最终被打包到了哪一个“强连通分量（大胖点）”里。相当于它们在新图里的“新身份证号”。
//stk (Stack栈)：用来保存在当前搜索路径上，且还没有被确立归属的节点。
//cur：时间戳发号器（从 0 开始递增）。
//cnt：强连通分量的计数器（最终 cnt 的值就是缩点后新图的节点总数）。
struct SCC
{
    int n;
    vector<vector<int   >> adj;
    vector<int> stk;
    vector<int> dfn, low, bel;
    int cur, cnt;
    SCC() {}
    SCC(int n_)
    {
        init(n_);
    }
    //0 -index
    void init(int n_)
    {
        n = n_;
        adj.assign(n, {});
        dfn.assign(n, -1);
        low.resize(n);
        bel.assign(n, -1);
        stk.clear();
        cur = cnt = 0;
    }
    //u -> v
    void addEdge(int u, int v)
    {
        adj[u].push_back(v);
    }
    void dfs(int x)
    {
        dfn[x] = low[x] = cur++;// 一进门，先领个时间戳，并且一开始能回溯到的最早时间就是自己
        stk.push_back(x);// 进栈，表示正在处理中，还没归属
        for(auto y : adj[x])
        {
            if(dfn[y] == -1)//// 如果邻居 y 还没被访问过
            {
                dfs(y);//往下搜
                // 等 y 搜完回来了，用 y 能到达的最早时间来更新 x，因为此时y已经完整跑完了dfs
                low[x] = min(low[x], low[y]);
            }
            else if(bel[y] == -1)
            {
                low[x] = min(low[x], dfn[y]);//我们用y的时间戳更新low[x],因为x可以往回到达y
            }
        }
        if(dfn[x] == low[x])
        {
            int y;
            do{
                y = stk.back();// 把栈里在自己之上的兄弟全弹出来
                bel[y] = cnt;// 给他们统一下发同一个新的身份证号 cnt
                stk.pop_back();
            } while (y != x);// 直到把自己也弹出来为止
            cnt++;// 编号用完了，下一个环用新编号
        }
    }
    vector<int> work()
    {
        for (int i = 0;i < n;i++)
        {
            if(dfn[i] == -1)
                dfs(i);
        }
        return bel;
    }
};
```

#### 最小生成树Prim

```cpp
#include <bits/stdc++.h>
using namespace std;
const int MAXN = 5e3 + 5;
const int MAXM = 2e5 + 5;
const int INF = 1e9;
struct edge {
    int v;// 这条边的终点去哪？ (Destination)
    int w;// 这条边有多长？ (Weight)
    int next = 0;// 同一个起点的“上一条边”在哪？ (Linked List)
} e[MAXM << 1];// 无向图，边数要开 2 倍

int head[MAXN];// head[u] 表示：以 u 为起点的“最后加入的那条边”在数组 e 中的下标。
int cnt;// 给边编号的计数器。
int dis[MAXN];// 它代表 点 i 距离“最小生成树”这个集合的最短距离。
int vis[MAXN];// 标记数组：vis[i]=true 表示点 i 已经在生成树中
int n, m, tot, ans;// tot记录已加入生成树的点数
inline void add(int u,int v,int w)
{
    e[++cnt].v = v;// 1. 申请一个新的边位置 cnt，记录终点是 v
    e[cnt].w = w;// 2. 记录权值是 w
    // 下面这两步是“插头法”链接：
    e[cnt].next = head[u];// 3. 新边的 next 指向 u 节点原本的第一条边
    head[u] = cnt;// 4. 更新 u 节点的第一条边为当前这条新边
}
inline int prim()
{
    for (int i = 2; i <= n;i++)
    {
        dis[i] = INF;
    }
    for (int i = head[1]; i;i = e[i].next)
    {
        dis[e[i].v] = min(dis[e[i].v], e[i].w);
    }
    int now = 1;// now 表示最新加入树的那个点
    vis[1] = 1;// 1号点已入伙
    tot = 1;// 目前树里有 1 个点
    while(tot < n)
    {
        int minn = INF;
        now = 0;
        for (int i = 2; i <= n;i++)
        {
            if(!vis[i] && dis[i] < minn)
            {
                minn = dis[i];// 更新最小距离
                now = i;// 记下这个点
            }
        }
        if(minn == INF)
        {
            cout << "orz";
            return -1;
        }
        ans += minn;
        vis[now] = 1;
        tot++;
        for (int i = head[now]; i;i = e[i].next)
        {
            int v = e[i].v;
            if (!vis[v] &&e[i].w < dis[v])
            {
                dis[v] = e[i].w;
            }
        }
    }
    cout << ans;
    return 0;
}
int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);

    cin >> n >> m;
    int u, v, w;
    for (int i = 0; i < m; i++)
    {
        cin >> u >> v >> w;
        add(u, v, w);
        add(v, u, w);
    }
    prim();
}
```

#### 最小生成树Kruscal

```cpp
#include <bits/stdc++.h>
using namespace std;
const int MAXN = 5e3 + 5;
const int MAXM = 2e5 + 5;
struct edge{
    int u;
    int v;
    int w;
} e[MAXM];
struct DSU
{
    vector<int> f, siz;
    DSU() {};
    DSU(int n)
    {
        init(n);
    }
    //input n,open n + 1
    void init(int n)
    {
        f.resize(n + 1);
        iota(f.begin(), f.end(), 0);
        siz.assign(n + 1, 1);
    }
    int find(int x)
    {
        while(x != f[x])
            x = f[x] = f[f[x]];
        return x;
    }
    bool same(int x,int y)
    {
        return find(x) == find(y);
    }
    bool merge(int x,int y)
    {
        x = find(x);
        y = find(y);
        if(x == y)
            return false;
        if(siz[x] < siz[y])
            swap(x, y);
        siz[x] += siz[y];
        f[y] = x;
        return true;
    }
    int size(int x)
    {
        return siz[find(x)];
    }
};
int n, m, ans, cnt;
inline bool cmp(edge e1,edge e2)
{
    return e1.w < e2.w;
}
inline void kruskal()
{
    cin >> n >> m;
    DSU ds(n);
    for (int i = 0; i < m; i++)
    {
        cin >> e[i].u >> e[i].v >> e[i].w;
    }
    sort(e, e + m, cmp);
    for (int i = 0; i < m;i++)
    {
        int eu = ds.find(e[i].u);// 找 u 的祖先
        int ev = ds.find(e[i].v);// 找 v 的祖先
        if(eu == ev)
            continue;// 已经在同一个连通块，跳过，防止成环
        ans += e[i].w;// 累加边权
        ds.merge(eu, ev); // 合并两个集合
        if(++cnt == n - 1)
            break;
    }
}
int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    kruskal();
    if(cnt == n - 1)
    {
        cout << ans;
    }
    else
    {
        cout << "orz";
    }
}
```

### 字符串

#### 字典树Trie

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long
struct Trie
{
    // ch 存储每个节点的子节点编号，这里包含大小写字母加上数字
    vector<array<int, 70>> ch;
    // cnt 记录以当前节点为【结尾】的单词数量
    vector<int> cnt;
    // pre 记录经过当前节点的单词数量（即以此为【前缀】的数量）
    vector<int> pre;
    Trie()
    {
        newNode();// 编号为 0 的节点作为根节点
    }
    int newNode()
    {
        ch.push_back({0});// 初始化所有个子节点均为 0
        cnt.push_back(0);
        pre.push_back(0);
        return ch.size() - 1;
    }
    int getId(char c) const
    {
        if(c >= 'a' && c <= 'z')
            return c - 'a';
        else if(c >= 'A' && c <= 'Z')
            return c - 'A' + 26;
        else if(c >= '0' && c <= '9')
            return c - '0' + 52;
    }
    void insert(const string& s)
    {
        int p = 0;// 从根节点开始
        for(char c : s)
        {
            int u = getId(c);//字符映射
            if(!ch[p][u])
                ch[p][u] = newNode();// 如果没有该子节点，则新建
            p = ch[p][u];
            pre[p]++;
        }
        cnt[p]++;//在完整走完之后，此时单词已经抵达终点，终点的计数器+1，表明这里是一个完整单词的结尾
    }
    int search(const string &s)
    {
        int p = 0;
        for(char c : s)
        {
            int u = getId(c);
            if(!ch[p][u])
                return 0;// 匹配中断，说明不存在
            p = ch[p][u];
        }
        return cnt[p];
    }
    int searchPrefix(const string &s)
    {
        int p = 0;
        for(char c : s)
        {
            int u = getId(c);
            if(!ch[p][u])
                return 0;
            p = ch[p][u];
        }
        return pre[p];
    }
};
```

#### EXKMP

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
//EXKMP用来求“最长公共前缀（LCP）
struct EXKMP
{
    //z[i] 的意思是：把字符串 b 从第 i 个位置开始往后切，切下来的这半截，和原字符串 b 的开头，能有多长是一模一样的？
    vector<int> z;
    //p[i] 的意思是：把字符串 a 从第 i 个位置开始往后切，切下来的这半截，和原字符串 b 的开头，能有多长是一模一样的？
    vector<int> p;
    void get_z(const string& b)
    {
        int m = b.size();
        z.assign(m, 0);
        if(m == 0)// 容错处理，空串直接溜
            return;
        z[0] = m;
        for (int i = 1, l = 0, r = -1; i < m;i++)
        {
            if(i <= r && z[i - l] < r - i + 1)
                z[i] = z[i - l];
            else
            {
                z[i] = max(0, r - i + 1);
                while(i + z[i] < m && b[z[i]] == b[i + z[i]])
                    z[i]++;
            }
            if(i + z[i] - 1 > r)// 这其实就是 i + z[i] - 1 > r 的变形
            {
                l = i;
                r = i + z[i] - 1;// r 被推到了新的最远端
            }
        }
    }
    void get_p(const string& a, const string& b)
    {
        int n = a.size(), m = b.size();
        p.assign(n, 0);
        for (int i = 0, l = 0, r = -1; i < n;i++)
        {
            if(i <= r && z[i - l] < r - i + 1)
                p[i] = z[i - l];
            else
            {
                p[i] = max(0, r - i + 1);
                while(i + p[i] < n && p[i] < m && a[i + p[i]] == b[p[i]])
                    p[i]++;
                
            }
            if(i + p[i] - 1 > r)
            {
                l = i;
                r = i + p[i] - 1;
            }
        }
    }
};
```

#### KMP

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
//定义一个字符串 s 的 border 为 s 的一个非 s 本身的子串 t，满足 t 既是 s 的前缀，又是 s 的后缀。
struct KMP
{
    vector<int> pi;// pi[i] 记录长度为 i+1 的前缀的最长 border 长度
    // 1. 预处理模式串 p，构造 pi 数组 (也就是 next 数组)
    void build(const string& p)
    {
        int m = p.size();
        pi.assign(m, 0);// pi[0] 显然是 0，因为真子串不能是原串本身
        for (int i = 1, j = 0; i < m;i++)
        {
            while(j > 0 && p[i] != p[j])
                j = pi[j - 1];
            if(p[i] == p[j])
                j++;
            pi[i] = j;
        }
    }
    vector<int> match(const string& s, const string& p)
    {
        int n = s.size();
        int m = p.size();
        vector<int> res;
        for (int i = 0, j = 0; i < n;i++)
        {
            while(j > 0 && s[i] != p[j])
                j = pi[j - 1];
            if(s[i] == p[j])
                j++;
            if(j == m)
            {
                res.push_back(i - m + 2);
                j = pi[j - 1];
            }
        }
        return res;
    }
};
```

### 动态规划

#### 数位dp

```cpp
#include<iostream>
#include<vector>
us
int a, b;
int pow10[15];
int change(vector<int>num, int l, int r) {
    int ans = 0;
    for (int i = l; i >= r; --i) {
        ans = ans * 10 + num[i];
    }
    return ans;
}
int cal(int n, int x) {
    vector<int>num;
    while (n) {
        num.push_back(n % 10);
        n /= 10;
    }
    n = num.size();
    int res = 0;
    for (int i = n - 1; i >= 0; --i) {
        if ((!x) && (i == n - 1))continue;
        if (i < n - 1) {
            int tem = change(num, n - 1, i + 1);
            if (!x)tem--;
            res += tem * pow10[i];
        }
        if (num[i] == x)res += change(num, i - 1, 0) + 1;
        else if (num[i] > x)res += pow10[i];
    }
    return res;
}
int main() {
    pow10[0] = 1;
    for (int i = 1; i <= 10; ++i) {
        pow10[i] = pow10[i - 1] * 10;
    }
    while (1) {
        cin >> a >> b;
        if (!a && !b)break;
        if (a > b)swap(a, b);
        for (int i = 0; i < 10; ++i) {
            cout << cal(b, i) - cal(a - 1, i) << " ";
        }
        cout << endl;
    }
    return 0;
}
```



### 杂项

#### 高精度无符号

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
struct BigInt
{
    vector<int> vec;
    BigInt(i64 x = 0)
    {
        if(x == 0)
            vec.push_back(0);
        while(x)
        {
            vec.push_back(x % 10);
            x /= 10;
        }
    }
    BigInt(string s)
    {
        for (int i = s.size() - 1; i >= 0;i--)
        {
            vec.push_back(s[i] - '0');
        }
        trim();
    }
    void trim()
    {
        while(vec.size() > 1 && vec.back() == 0)
            vec.pop_back();
    }
    bool operator<(const BigInt& b) const
    {
        if(vec.size() != b.vec.size())
            return vec.size() < b.vec.size();
        for (int i = vec.size() - 1; i >= 0;i--)
        {
            if(vec[i] != b.vec[i])
                return vec[i] < b.vec[i];
        }
        return false;
    }
    bool operator>(const BigInt &b) const { return b < *this; }
    bool operator<=(const BigInt &b) const { return !(*this > b); }
    bool operator>=(const BigInt &b) const { return !(*this < b); }
    bool operator==(const BigInt &b) const { return vec == b.vec; }
    bool operator!=(const BigInt &b) const { return vec != b.vec; }
    BigInt operator+=(const BigInt& b)
    {
        int t = 0;
        for (int i = 0; i < max(vec.size(), b.vec.size()) || t;i++)
        {
            if(i == vec.size())
                vec.push_back(0);
            vec[i] += t + (i < b.vec.size() ? b.vec[i] : 0);
            t = vec[i] / 10;
            vec[i] %= 10;
        }
        trim();
        return *this;
    }
    friend BigInt operator+(BigInt a,const BigInt& b)
    {
        a += b;
        return a;
    }
    //assume this > b
    BigInt operator-=(const BigInt& b)
    {
        int t = 0;
        for (int i = 0; i < b.vec.size() || t;i++)
        {
            vec[i] -= t + (i < b.vec.size() ? b.vec[i] : 0);
            if(vec[i] < 0)
            {
                vec[i] += 10;
                t = 1;
            }
            else
                t = 0;
        }
        trim();
        return *this;
    }
    friend BigInt operator-(BigInt a,const BigInt& b)
    {
        a -= b;
        return a;
    }
    friend BigInt operator*(const BigInt& a,const BigInt& b)
    {
        if((a.vec.size() == 1 && a.vec[0] == 0) || (b.vec.size() == 1 && b.vec[0] == 0))
        return BigInt(0);
        BigInt res(0);
        res.vec.assign(a.vec.size() + b.vec.size() + 5, 0);
        for (int i = 0; i < a.vec.size();i++)
        {
            for (int j = 0; j < b.vec.size();j++)
            {
                res.vec[i + j] += a.vec[i] * b.vec[j];
                res.vec[i + j + 1] += res.vec[i + j] / 10;
                res.vec[i + j] %= 10;
            }
        }
        res.trim();
        return res;
    }
    BigInt operator*(int b) const 
    {
        if(b == 0)
            return BigInt(0);
        BigInt res = *this;
        int t = 0;
        for (int i = 0; i < res.vec.size() || t;i++)
        {
            if(i == res.vec.size())
                res.vec.push_back(0);
            i64 cur = 1ll * res.vec[i] * b + t;
            res.vec[i] = cur % 10;
            t = cur / 10;
        }
        res.trim();
        return res;
    }
    BigInt &operator*=(const BigInt b) &
    {
        *this = *this * b;
        return *this;
    }
    //返回{商，余数}
    static pair<BigInt,BigInt> divmod(BigInt a,const BigInt& b)
    {
        if(a < b)
            return {BigInt{0}, a};
        BigInt q(0), r(0);
        q.vec.assign(a.vec.size(), 0);
        for (int i = a.vec.size() - 1; i >= 0;i--)
        {
            r = r * 10 + a.vec[i];
            int cnt = 0;
            while(r >= b)
            {
                r -= b;
                cnt++;
            }
            q.vec[i] = cnt;
        }
        q.trim();
        return {q, r};
    }
    friend BigInt operator/(BigInt& a,BigInt& b)
    {
        return divmod(a, b).first;
    }
    friend BigInt operator%(BigInt& a,BigInt& b)
    {
        return divmod(a, b).second;
    }
    BigInt operator/=(const BigInt& b)
    {
        *this = divmod(*this, b).first;
        return *this;
    }
    BigInt operator%=(const BigInt& b)
    {
        *this = divmod(*this, b).second;
        return *this;
    }
    friend ostream& operator<<(ostream& os,const BigInt& a)
    {
        for (int i = a.vec.size() - 1; i >= 0;i--)
            os << a.vec[i];
        return os;
    }
    friend istream& operator>>(istream& is,BigInt& a)
    {
        string s;
        if(!(is >> s))
            return is;
        a = BigInt(s);
        return is;
    }
};
```

#### 高精度有符号

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
struct BigInt
{
    vector<int> vec;
    int sign;
    BigInt(i64 x = 0)
    {
        if(x < 0)
            sign = -1, x = -x;
        else
            sign = 1;
        if(x == 0)
            vec.push_back(0);
        while(x)
        {
            vec.push_back(x % 10);
            x /= 10;
        }
    }
    BigInt(string s)
    {
        if(s.empty())
        {
            sign = 1;
            vec = {0};
            return;
        }
        if(s[0] == '-')
        {
            sign = -1;
            s = s.substr(1);
        }
        else
            sign = 1;
        for (int i = s.size() - 1; i >= 0;i--)
        {
            vec.push_back(s[i] - '0');
        }
        trim();
    }
    void trim()
    {
        while(vec.size() > 1 && vec.back() == 0)
            vec.pop_back();
        if(vec.size() == 1 && vec[0] == 0)
            sign = 1;
    }
    static bool abs_less(const BigInt& a,const BigInt &b)
    {
        if(a.vec.size() != b.vec.size())
            return a.vec.size() < b.vec.size();
        for (int i = a.vec.size() - 1; i >= 0;i--)
        {
            if(a.vec[i] != b.vec[i])
                return a.vec[i] < b.vec[i];
        }
        return false;
    }
    bool operator<(const BigInt& b) const
    {
        if(sign != b.sign)
            return sign < b.sign;
        if(sign == 1)
            return abs_less(*this, b);
        else
            return abs_less(b, *this);
    }
    bool operator>(const BigInt &b) const { return b < *this; }
    bool operator<=(const BigInt &b) const { return !(*this > b); }
    bool operator>=(const BigInt &b) const { return !(*this < b); }
    bool operator==(const BigInt &b) const { return (sign == b.sign && vec == b.vec); }
    bool operator!=(const BigInt &b) const { return !(*this == b); }
    static BigInt abs_add(const BigInt& a, const BigInt& b) {
        BigInt res;
        res.vec.clear();
        int t = 0;
        for (int i = 0; i < max(a.vec.size(), b.vec.size()) || t; i++) {
            int cur = t + (i < a.vec.size() ? a.vec[i] : 0) + (i < b.vec.size() ? b.vec[i] : 0);
            res.vec.push_back(cur % 10);
            t = cur / 10;
        }
        return res;
    }
    static BigInt abs_sub(const BigInt& a, const BigInt& b) {
        BigInt res = a;
        int t = 0;
        for (int i = 0; i < b.vec.size() || t; i++) {
            res.vec[i] -= t + (i < b.vec.size() ? b.vec[i] : 0);
            if (res.vec[i] < 0) {
                res.vec[i] += 10;
                t = 1;
            } else t = 0;
        }
        res.trim();
        return res;
    }
    friend BigInt operator+(BigInt a, const BigInt& b) {
        if (a.sign == b.sign) {
            BigInt res = abs_add(a, b);
            res.sign = a.sign;
            return res;
        }
        if (abs_less(a, b)) {
            BigInt res = abs_sub(b, a);
            res.sign = b.sign;
            return res;
        } else {
            BigInt res = abs_sub(a, b);
            res.sign = a.sign;
            return res;
        }
    }
    friend BigInt operator-(BigInt a, BigInt b) {
        b.sign *= -1;
        return a + b;
    }
    friend BigInt operator*(const BigInt& a, const BigInt& b) {
        if ((a.vec.size() == 1 && a.vec[0] == 0) || (b.vec.size() == 1 && b.vec[0] == 0))
            return BigInt(0);
        BigInt res;
        res.vec.assign(a.vec.size() + b.vec.size(), 0);
        for (int i = 0; i < a.vec.size(); i++) {
            for (int j = 0; j < b.vec.size(); j++) {
                res.vec[i + j] += a.vec[i] * b.vec[j];
                res.vec[i + j + 1] += res.vec[i + j] / 10;
                res.vec[i + j] %= 10;
            }
        }
        res.sign = a.sign * b.sign;
        res.trim();
        return res;
    }
    BigInt operator-() const {
        BigInt res = *this;
        if (res != BigInt(0)) res.sign *= -1;
        return res;
    }
    BigInt& operator+=(const BigInt& b) { return *this = *this + b; }
    BigInt& operator-=(const BigInt& b) { return *this = *this - b; }
    BigInt& operator*=(const BigInt& b) { return *this = *this * b; }
    // 核心：绝对值除法 (返回 {绝对值商, 绝对值余数})
    static pair<BigInt, BigInt> abs_divmod(const BigInt& a, const BigInt& b) {
        if (b == BigInt(0)) return {BigInt(0), BigInt(0)}; // 实际应用中应抛出除0异常
        if (abs_less(a, b)) return {BigInt(0), a};
        BigInt q, r(0);
        q.vec.assign(a.vec.size(), 0);
        for (int i = a.vec.size() - 1; i >= 0; i--) {
            r = r * 10 + BigInt(a.vec[i]);
            int cnt = 0;
            while (!abs_less(r, b)) {
                r = abs_sub(r, b);
                cnt++;
            }
            q.vec[i] = cnt;
        }
        q.trim();
        r.trim();
        return {q, r};
    }
    // 封装有符号除法
    friend pair<BigInt, BigInt> divmod(BigInt a, BigInt b) {
        int res_q_sign = a.sign * b.sign;
        int res_r_sign = a.sign; // 余数符号与被除数一致
        pair<BigInt, BigInt> res = abs_divmod(a, b);
        res.first.sign = res_q_sign;
        res.second.sign = res_r_sign;        
        res.first.trim();  // 再次 trim 确保 -0 变 0
        res.second.trim();
        return res;
    }
    BigInt operator/(const BigInt& b) const { return divmod(*this, b).first; }
    BigInt operator%(const BigInt& b) const { return divmod(*this, b).second; }
    BigInt& operator/=(const BigInt& b) { return *this = *this / b; }
    BigInt& operator%=(const BigInt& b) { return *this = *this % b; }
    BigInt operator*(int b_int) const {
        if (b_int == 0) return BigInt(0);
        BigInt b_big(b_int);
        return (*this) * b_big;
    }
    friend ostream& operator<<(ostream& os, const BigInt& a) {
        if (a.sign == -1) os << '-';
        for (int i = a.vec.size() - 1; i >= 0; i--) os << a.vec[i];
        return os;
    }
    friend istream& operator>>(istream& is, BigInt& a) {
        string s;
        if (!(is >> s)) return is;
        a = BigInt(s);
        return is;
    }
};
```

#### int128输出流自定义

```cpp
#include <bits/stdc++.h>
using namespace std;
using i128 = __int128;
ostream &operator<<(ostream &os, i128 n) {
    string s;
    int f = 0;
    if(n == 0)
        s = "0";
    if(n < 0)
    {
        f = 1;
        n = -n;
    }
    while (n) {
        s += '0' + n % 10;
        n /= 10;
    }
    reverse(s.begin(), s.end());
    if(f)
        s = '-' + s;
    return os << s;
}
istream &operator>>(istream &is,i128& n)
{
    n = 0;
    string s;
    is >> s;
    int sign = 1, start = 0;
    if(s[0] == '-')
    {
        sign = -1;
        start = 1;
    }
    for (int i = start; i < s.size();i++)
    {
        n = n * 10 + s[i] - '0';
    }
    n *= sign;
    return is;
}
```

#### 分数四则运算

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;
template<class T>
struct Frac
{
    T num;
    T den;
    void normalize() 
    {
        if (den < 0) 
        { 
            num = -num; 
            den = -den; 
        }
        T g = gcd(num, den);
        if (g != 0) { num /= g; den /= g; }
    }
    Frac(T num_, T den_) : num(num_), den(den_)
    {
        if(den < 0)
        {
            den = -den;
            num = -num;
        }
    }
    Frac() : Frac(0, 1) {}
    Frac(T num_) : Frac(num_, 1){}
    explicit operator double() const
    {
        return 1. * num / den;
    }
    Frac &operator+=(const Frac &rhs)
    {
        num = num * rhs.den + rhs.num * den;
        den *= rhs.den;
        normalize(); 
        return *this;
    }
    Frac &operator-=(const Frac &rhs)
    {
        num = num * rhs.den - rhs.num * den;
        den *= rhs.den;
        normalize(); 
        return *this;
    }
    Frac &operator*=(const Frac &rhs)
    {
        num *= rhs.num;
        den *= rhs.den;
        normalize(); 
        return *this;
    }
    Frac &operator/=(const Frac &rhs)
    {
        num *= rhs.den;
        den *= rhs.num;
        if(den < 0)
        {
            num = -num;
            den = -den;
        }
        normalize();
        return *this;
    }
    friend Frac operator+(Frac lhs, const Frac &rhs)
    {
        return lhs += rhs;
    }
    friend Frac operator-(Frac lhs, const Frac &rhs)
    {
        return lhs -= rhs;
    }
    friend Frac operator*(Frac lhs, const Frac &rhs)
    {
        return lhs *= rhs;
    }
    friend Frac operator/(Frac lhs, const Frac &rhs)
    {
        return lhs /= rhs;
    }
    friend Frac operator-(const Frac &a)
    {
        return Frac(-a.num, a.den);
    }
    friend bool operator==(const Frac &lhs, const Frac &rhs)
    {
        return lhs.num * rhs.den == rhs.num * lhs.den;
    }
    friend bool operator!=(const Frac &lhs, const Frac &rhs)
    {
        return lhs.num * rhs.den != rhs.num * lhs.den;
    }
    friend bool operator<(const Frac &lhs, const Frac &rhs)
    {
        return lhs.num * rhs.den < rhs.num * lhs.den;
    }
    friend bool operator>(const Frac &lhs, const Frac &rhs)
    {
        return lhs.num * rhs.den > rhs.num * lhs.den;
    }
    friend bool operator<=(const Frac &lhs, const Frac &rhs)
    {
        return lhs.num * rhs.den <= rhs.num * lhs.den;
    }
    friend bool operator>=(const Frac &lhs, const Frac &rhs) 
    {
        return lhs.num * rhs.den >= rhs.num * lhs.den;
    }
    friend ostream &operator<<(ostream &os, Frac x)
    {
        T g = gcd(x.num, x.den);
        if(x.den == g)
            return os << x.num / g;
        else
            return os << x.num / g << "/" << x.den / g;
    }
};
```

