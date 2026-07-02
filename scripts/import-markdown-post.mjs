import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { execFileSync } from "node:child_process";
import yaml from "js-yaml";
import { createExtractorFromData } from "node-unrar-js";

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "src", "content", "posts");
const importsDir = path.join(repoRoot, "imports", "markdown");
const payload = JSON.parse(process.env.PAGES_CMS_PAYLOAD || process.argv[2] || "{}");
const inputs = payload.inputs || {};
const localImageSources = new Set();

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

function isInside(parent, child) {
    const relative = path.relative(parent, child);
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function findMarkdownFile(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const candidates = [];

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            const nestedMarkdown = await findMarkdownFile(fullPath);
            if (nestedMarkdown) candidates.push(nestedMarkdown);
        } else if (/\.(md|markdown)$/i.test(entry.name)) {
            candidates.push(fullPath);
        }
    }

    candidates.sort((a, b) => {
        const aName = path.basename(a).toLowerCase();
        const bName = path.basename(b).toLowerCase();
        if (aName === "index.md") return -1;
        if (bName === "index.md") return 1;
        if (aName === "readme.md") return -1;
        if (bName === "readme.md") return 1;
        return a.localeCompare(b);
    });
    return candidates[0];
}

async function extractZip(zipPath) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "keylun-md-import-"));

    try {
        if (process.platform === "win32") {
            execFileSync("tar", ["-xf", zipPath, "-C", tempDir], { stdio: "inherit" });
        } else {
            execFileSync("unzip", ["-q", zipPath, "-d", tempDir], { stdio: "inherit" });
        }

        const markdownPath = await findMarkdownFile(tempDir);
        if (!markdownPath) {
            throw new Error("压缩包里没有找到 .md 或 .markdown 文件。");
        }

        return {
            markdown: await fs.readFile(markdownPath, "utf8"),
            localBaseDir: path.dirname(markdownPath),
            localRootDir: tempDir,
            sourcePath: zipPath,
            cleanupDir: tempDir,
        };
    } catch (error) {
        await fs.rm(tempDir, { recursive: true, force: true });
        throw error;
    }
}

async function extractRar(rarPath) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "keylun-md-import-"));

    try {
        const archiveData = await fs.readFile(rarPath);
        const archiveBuffer = archiveData.buffer.slice(archiveData.byteOffset, archiveData.byteOffset + archiveData.byteLength);
        const extractor = await createExtractorFromData({ data: archiveBuffer });
        const extracted = extractor.extract();

        for (const file of extracted.files) {
            if (file.fileHeader.flags.directory || !file.extraction) continue;

            const entryPath = file.fileHeader.name.replace(/\\/g, "/");
            const outputPath = path.resolve(tempDir, entryPath);
            if (!isInside(tempDir, outputPath)) {
                console.warn(`跳过超出压缩包目录的文件：${entryPath}`);
                continue;
            }

            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, Buffer.from(file.extraction));
        }

        const markdownPath = await findMarkdownFile(tempDir);
        if (!markdownPath) {
            throw new Error("压缩包里没有找到 .md 或 .markdown 文件。");
        }

        return {
            markdown: await fs.readFile(markdownPath, "utf8"),
            localBaseDir: path.dirname(markdownPath),
            localRootDir: tempDir,
            sourcePath: rarPath,
            cleanupDir: tempDir,
        };
    } catch (error) {
        await fs.rm(tempDir, { recursive: true, force: true });
        throw error;
    }
}

async function readMarkdownSource() {
    if (inputs.markdown_text?.trim()) {
        return {
            markdown: inputs.markdown_text,
            markdownUrl: normalizeMarkdownUrl(inputs.markdown_url),
        };
    }

    const sourceUrl = normalizeMarkdownUrl(inputs.markdown_url);
    if (sourceUrl) {
        const res = await fetch(sourceUrl);
        if (!res.ok) throw new Error(`Markdown URL 下载失败：${res.status} ${sourceUrl}`);
        return {
            markdown: await res.text(),
            markdownUrl: sourceUrl,
        };
    }

    const contextPath = payload.context?.path;
    if (contextPath && /\.(md|markdown|zip|rar)$/i.test(contextPath)) {
        const fullPath = path.resolve(repoRoot, contextPath);
        if (!fullPath.startsWith(importsDir + path.sep)) {
            throw new Error(`只允许从 ${path.relative(repoRoot, importsDir)} 导入 Markdown`);
        }
        if (/\.zip$/i.test(fullPath)) {
            return await extractZip(fullPath);
        }
        if (/\.rar$/i.test(fullPath)) {
            return await extractRar(fullPath);
        }
        return {
            markdown: await fs.readFile(fullPath, "utf8"),
            localBaseDir: path.dirname(fullPath),
            localRootDir: importsDir,
            sourcePath: fullPath,
        };
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
        url.startsWith("/assets/")
    );
}

function getLocalImageContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".png") return "image/png";
    if (ext === ".webp") return "image/webp";
    if (ext === ".gif") return "image/gif";
    if (ext === ".svg") return "image/svg+xml";
    if (ext === ".avif") return "image/avif";
    return "";
}

async function readLocalImage(source, sourceContext) {
    if (!sourceContext.localBaseDir || !sourceContext.localRootDir) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(source) || source.startsWith("/")) return null;

    const localPath = path.resolve(sourceContext.localBaseDir, decodeURIComponent(source));
    if (!isInside(sourceContext.localRootDir, localPath)) {
        console.warn(`跳过超出导入目录的图片：${source}`);
        return null;
    }

    const stat = await fs.stat(localPath).catch(() => null);
    if (!stat?.isFile()) {
        console.warn(`跳过不存在的本地图片：${source}`);
        return null;
    }

    const contentType = getLocalImageContentType(localPath);
    if (!contentType.startsWith("image/")) {
        console.warn(`跳过非图片本地文件：${source}`);
        return null;
    }

    localImageSources.add(localPath);
    return {
        buffer: await fs.readFile(localPath),
        contentType,
        resolvedUrl: localPath,
    };
}

async function readRemoteImage(source, sourceContext) {
    let resolvedUrl = source;
    if (!/^https?:\/\//i.test(source)) {
        if (!sourceContext.markdownUrl) return null;
        resolvedUrl = new URL(source, sourceContext.markdownUrl).toString();
    }

    const res = await fetch(resolvedUrl, {
        headers: {
            "User-Agent": "keylun-notes-md-importer/1.0",
        },
    });
    if (!res.ok) {
        console.warn(`跳过下载失败的图片：${res.status} ${resolvedUrl}`);
        return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
        console.warn(`跳过非图片资源：${contentType} ${resolvedUrl}`);
        return null;
    }

    return {
        buffer: Buffer.from(await res.arrayBuffer()),
        contentType,
        resolvedUrl,
    };
}

async function downloadImages(body, sourceContext, postSlug) {
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

        const image = await readLocalImage(source, sourceContext) ?? await readRemoteImage(source, sourceContext);
        if (!image) continue;

        const { buffer, contentType, resolvedUrl } = image;
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

const sourceContext = await readMarkdownSource();
sourceContext.markdown = sourceContext.markdown.replace(/^\uFEFF/, "");
const parsed = parseFrontmatter(sourceContext.markdown);
const nowDate = toDateString();
const title = inputs.title?.trim() || parsed.data.title || extractTitle(parsed.body);
const slug = slugify(inputs.slug || parsed.data.routeName || title);
const published = toDateString(inputs.published || parsed.data.published || nowDate);
const filename = `${published}-${slug}.md`;
const outputPath = path.join(postsDir, filename);

let body = parsed.body.trimStart();
body = await downloadImages(body, sourceContext, slug);

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

if (sourceContext.sourcePath && boolValue(inputs.delete_source, true)) {
    const sourcePath = path.resolve(repoRoot, sourceContext.sourcePath);
    if (sourcePath.startsWith(importsDir + path.sep)) {
        await fs.rm(sourcePath, { force: true });
    }
    for (const imagePath of localImageSources) {
        if (imagePath.startsWith(importsDir + path.sep)) {
            await fs.rm(imagePath, { force: true });
        }
    }
}

if (sourceContext.cleanupDir) {
    await fs.rm(sourceContext.cleanupDir, { recursive: true, force: true });
}

console.log(`Imported Markdown post: ${path.relative(repoRoot, outputPath)}`);
