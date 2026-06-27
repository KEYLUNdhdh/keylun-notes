# Keylun Notes

Astro 个人技术博客，适合写算法笔记、论文阅读、课程项目和工程复盘。

## 本地开发

```bash
npm install
npm run dev
```

打开 `http://localhost:4321`。

## 写文章

文章放在 `src/content/blog/`，使用 Markdown 或 MDX。

```md
---
title: "文章标题"
description: "一句话摘要"
pubDate: 2026-06-27
tags: ["algorithm", "paper-reading"]
---

正文内容。
```

每篇文章的 `tags` 会自动生成：

- `/tags` 标签总览
- `/tags/algorithm/` 这类单标签文章列表
- 首页右侧标签云

## 管理后台

后台入口：

```text
/admin
```

当前配置使用 Decap CMS 的预览/本地模式，方便先看管理界面。它可以管理：

- `src/content/blog/*.md`：文章
- `src/data/profile.json`：个人资料、头像、教育经历、联系方式
- `public/uploads/`：后台上传的图片

当前 `backend.name` 是 `github`，仓库指向 `KEYLUNdhdh/keylun-notes`。正式可写还需要给 Decap CMS 配 GitHub OAuth proxy。

已包含 Cloudflare Pages Functions OAuth proxy：

- `/api/auth`
- `/api/callback`

在 GitHub OAuth App 中使用：

```text
Homepage URL:
https://keylun-notes.yexinnan20070127.workers.dev/admin/

Authorization callback URL:
https://keylun-notes.yexinnan20070127.workers.dev/api/callback
```

然后在 Cloudflare 项目环境变量中添加：

```text
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
```

`GITHUB_CLIENT_SECRET` 必须设为加密/Secret 变量，不要提交到仓库。

如果想在本地让后台直接写入当前项目文件：

1. 把 `public/admin/config.yml` 里的 backend 临时改成：

   ```yml
   backend:
     name: git-gateway
     branch: main
   ```

2. 在项目根目录启动 Decap Proxy：

   ```bash
   npx decap-server
   ```

3. 另一个终端启动 Astro：

   ```bash
   npm run dev
   ```

Decap 官方说明：本地写入需要 `local_backend: true`，并从仓库根目录运行 `npx decap-server`。本地 proxy 只适合开发环境，不要暴露到公网。

正式上线前，请把 `public/admin/config.yml` 里的 backend 改成真实 GitHub 后端，例如：

```yml
backend:
  name: github
  repo: your-github-username/your-repo
  branch: main
```

然后用 GitHub OAuth、Cloudflare Access 或部署平台提供的身份认证保护 `/admin`。不要把 GitHub token 或管理员密码写进前端代码。

## 常用命令

```bash
npm run dev      # 本地预览
npm run build    # 生产构建
npm run preview  # 预览 dist
```

## 部署到 Cloudflare Pages

1. 把项目推到 GitHub。
2. 在 Cloudflare Pages 新建项目并连接仓库。
3. Framework preset 选择 `Astro`。
4. Build command 填 `npm run build`。
5. Output directory 填 `dist`。
6. 环境变量可选填：`SITE=https://你的域名`。

## 部署到 GitHub Pages

仓库 Settings -> Pages -> Source 选择 GitHub Actions。项目内已经带 `.github/workflows/deploy.yml`。

如果使用自定义域名，请把 `astro.config.mjs` 的 `SITE` 环境变量设置为正式域名，或者直接把默认值改成你的域名。

## 上线前替换

- `src/consts.ts`：站点名、描述、作者、GitHub 地址。
- `public/avatar.png`：头像，可以直接替换为同名图片。
- `src/data/profile.json`：个人资料、首页文案、教育经历和联系方式；也可以通过 `/admin` 修改。
- `src/pages/projects.astro`：项目列表和链接。
- `astro.config.mjs`：正式站点 URL，影响 sitemap、RSS 和 canonical URL。
