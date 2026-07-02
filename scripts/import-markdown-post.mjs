import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import yaml from "js-yaml";

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "src", "content", "posts");
const importsDir = path.join(repoRoot, "src", "imports", "markdown");
const payload = JSON.parse(process.env.PAGES_CMS_PAYLOAD || process.argv[2] || "{}");
const inputs = payload.inputs || {};

function boolValue(value, fallback = false) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function toDateString(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return toDateString(new Date());
    return date.toISOString().slice(0, 10);
}

function slugify(value) {
    const slug = String(value || "")
        .trim()
        .normalize("NFKC")
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
    return slug || `imported-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`;
}

function parseTags(value) {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    return String(value || "")
        .split(/[,，\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean);
}

function parseFrontmatter(markdown) {
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) return { data: {}, body: markdown };
    return {
        data: yaml.load(match[1]) || {},
        body: markdown.slice(match[0].length),
    };
}

function extractTitle(body, fallback) {
    const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
    return heading || fallback || "未命名文章";
}

function normalizeMarkdownUrl(url) {
    if (!url) return "";
    const trimmed = String(url).trim();
    const githubBlob = trimmed.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
    if (!githubBlob) return trimmed;
    return `https://raw.githubusercontent.com/${githubBlob[1]}/${githubBlob[2]}/${githubBlob[3]}`;
}

async function readMarkdownSource() {
    if (inputs.markdown_text?.trim()) return inputs.markdown_text;

    const sourceUrl = normalizeMarkdownUrl(inputs.markdown_url);
    if (sourceUrl) {
        const res = await fetch(sourceUrl);
        if (!res.ok) throw new Error(`Markdown URL 下载失败：${res.status} ${sourceUrl}`);
        return await res.text();
    }

    const contextPath = payload.context?.path;
    if (contextPath && /\.(md|markdown)$/i.test(contextPath)) {
        const fullPath = path.resolve(repoRoot, contextPath);
        if (!fullPath.startsWith(importsDir + path.sep)) {
            throw new Error(`只允许从 ${path.relative(repoRoot, importsDir)} 导入 Markdown`);
        }
        return await fs.readFile(fullPath, "utf8");
    }

    throw new Error("请填写 Markdown 原文、Markdown URL，或在 Markdown 导入媒体库中触发导入动作。");
}

function getImageExtension(contentType, sourceUrl) {
    const cleanUrl = sourceUrl.split("?")[0].split("#")[0];
    const fromUrl = path.extname(cleanUrl).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"].includes(fromUrl)) {
        return fromUrl;
    }
    if (contentType?.includes("jpeg")) return ".jpg";
    if (contentType?.includes("png")) return ".png";
    if (contentType?.includes("webp")) return ".webp";
    if (contentType?.includes("gif")) return ".gif";
    if (contentType?.includes("svg")) return ".svg";
    if (contentType?.includes("avif")) return ".avif";
    return ".png";
}

function isSkippableImage(url) {
    return (
        !url ||
        url.startsWith("#") ||
        url.startsWith("data:") ||
        url.startsWith("mailto:") ||
        url.startsWith("/assets/") ||
        url.startsWith("./") ||
        url.startsWith("../")
    );
}

async function downloadImages(body, markdownUrl, postSlug) {
    const shouldDownload = boolValue(inputs.download_images, true);
    if (!shouldDownload) return body;

    const assetsDirName = `${postSlug}-assets`;
    const assetsDir = path.join(postsDir, assetsDirName);
    const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
    const replacements = [];
    let index = 1;

    for (const match of body.matchAll(imagePattern)) {
        const [fullMatch, alt, rawUrl] = match;
        const source = rawUrl.trim();
        if (isSkippableImage(source)) continue;

        let resolvedUrl = source;
        if (!/^https?:\/\//i.test(source)) {
            if (!markdownUrl) continue;
            resolvedUrl = new URL(source, markdownUrl).toString();
        }

        const res = await fetch(resolvedUrl, {
            headers: {
                "User-Agent": "keylun-notes-md-importer/1.0",
            },
        });
        if (!res.ok) {
            console.warn(`跳过下载失败的图片：${res.status} ${resolvedUrl}`);
            continue;
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) {
            console.warn(`跳过非图片资源：${contentType} ${resolvedUrl}`);
            continue;
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 8);
        const ext = getImageExtension(contentType, resolvedUrl);
        const filename = `image-${String(index).padStart(2, "0")}-${hash}${ext}`;
        await fs.mkdir(assetsDir, { recursive: true });
        await fs.writeFile(path.join(assetsDir, filename), buffer);

        replacements.push({
            from: fullMatch,
            to: `![${alt}](./${assetsDirName}/${filename})`,
        });
        index += 1;
    }

    let nextBody = body;
    for (const item of replacements) {
        nextBody = nextBody.replace(item.from, item.to);
    }
    return nextBody;
}

function buildFrontmatter(data) {
    return yaml.dump(data, {
        lineWidth: 100,
        noRefs: true,
        sortKeys: false,
    }).trim();
}

const markdownUrl = normalizeMarkdownUrl(inputs.markdown_url);
const rawMarkdown = await readMarkdownSource();
const parsed = parseFrontmatter(rawMarkdown);
const nowDate = toDateString();
const title = inputs.title?.trim() || parsed.data.title || extractTitle(parsed.body);
const slug = slugify(inputs.slug || parsed.data.routeName || title);
const published = toDateString(inputs.published || parsed.data.published || nowDate);
const filename = `${published}-${slug}.md`;
const outputPath = path.join(postsDir, filename);

let body = parsed.body.trimStart();
body = await downloadImages(body, markdownUrl, slug);

const frontmatter = {
    ...parsed.data,
    title,
    published,
    updated: toDateString(inputs.updated || parsed.data.updated || published),
    description: inputs.description ?? parsed.data.description ?? "",
    cover: parsed.data.cover ?? "",
    coverInContent: parsed.data.coverInContent ?? false,
    category: inputs.category?.trim() || parsed.data.category || "",
    tags: parseTags(inputs.tags || parsed.data.tags),
    draft: boolValue(inputs.draft, Boolean(parsed.data.draft)),
};

await fs.mkdir(postsDir, { recursive: true });
await fs.writeFile(outputPath, `---\n${buildFrontmatter(frontmatter)}\n---\n${body}\n`, "utf8");

if (payload.context?.path && boolValue(inputs.delete_source, true)) {
    const sourcePath = path.resolve(repoRoot, payload.context.path);
    if (sourcePath.startsWith(importsDir + path.sep)) {
        await fs.rm(sourcePath, { force: true });
    }
}

console.log(`Imported Markdown post: ${path.relative(repoRoot, outputPath)}`);
