import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { execFileSync } from "node:child_process";
import yaml from "js-yaml";
import katex from "katex";
import { createExtractorFromData } from "node-unrar-js";

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "src", "content", "posts");
const publicPostAssetsDir = path.join(repoRoot, "public", "assets", "posts");
const importsDir = path.join(repoRoot, "imports", "markdown");
const payload = JSON.parse(process.env.PAGES_CMS_PAYLOAD || process.argv[2] || "{}");
const inputs = payload.inputs || {};
const localImageSources = new Set();
const imagePattern = /!\[([^\]]*)\]\(([^)\n]+)\)/g;

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

function normalizeTitle(value) {
    return String(value || "")
        .trim()
        .replace(/^#+\s+/, "")
        .replace(/^\*\*(.*?)\*\*$/s, "$1")
        .replace(/^__(.*?)__$/s, "$1")
        .trim();
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

function parseImageTarget(rawTarget) {
    const target = rawTarget.trim();
    if (target.startsWith("<")) {
        const endIndex = target.indexOf(">");
        if (endIndex > 0) {
            return {
                source: target.slice(1, endIndex).trim(),
                suffix: target.slice(endIndex + 1),
            };
        }
    }

    const imageTarget = target.match(/^(.+\.(?:jpg|jpeg|png|webp|gif|svg|avif)(?:[?#][^\s)]*)?)(\s+["'][\s\S]*["'])?$/i);
    if (imageTarget) {
        return {
            source: imageTarget[1].trim(),
            suffix: imageTarget[2] || "",
        };
    }

    const [source = "", ...rest] = target.split(/\s+/);
    return {
        source: source.trim(),
        suffix: rest.length ? ` ${rest.join(" ")}` : "",
    };
}

function safeDecodeURIComponent(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function cleanLocalImageSource(source) {
    return safeDecodeURIComponent(source)
        .replace(/\\/g, "/")
        .replace(/[?#].*$/, "")
        .trim();
}

function normalizeLookupName(value) {
    return path.basename(cleanLocalImageSource(value)).normalize("NFKC").toLowerCase();
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

async function findFilesRecursive(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...await findFilesRecursive(fullPath));
        } else if (entry.isFile()) {
            files.push(fullPath);
        }
    }

    return files;
}

async function findLocalImageByBasename(source, sourceContext) {
    if (!sourceContext.localRootDir) return null;

    const targetName = normalizeLookupName(source);
    if (!targetName) return null;

    const baseDir = sourceContext.localBaseDir || sourceContext.localRootDir;
    const candidates = (await findFilesRecursive(sourceContext.localRootDir))
        .filter((filePath) => {
            const contentType = getLocalImageContentType(filePath);
            return contentType.startsWith("image/") && normalizeLookupName(filePath) === targetName;
        })
        .sort((a, b) => {
            const aDistance = path.relative(baseDir, a).split(path.sep).length;
            const bDistance = path.relative(baseDir, b).split(path.sep).length;
            return aDistance - bDistance || a.localeCompare(b);
        });

    if (candidates.length > 0) {
        console.warn(`自动匹配本地图片：${source} -> ${path.relative(sourceContext.localRootDir, candidates[0])}`);
        return candidates[0];
    }

    return null;
}

async function readLocalImageFile(localPath, source) {
    const stat = await fs.stat(localPath).catch(() => null);
    if (!stat?.isFile()) return null;

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

async function readLocalImageAuto(source, sourceContext) {
    if (!sourceContext.localBaseDir || !sourceContext.localRootDir) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(source) || source.startsWith("/")) return null;

    const cleanedSource = cleanLocalImageSource(source);
    const localPath = path.resolve(sourceContext.localBaseDir, cleanedSource);

    if (isInside(sourceContext.localRootDir, localPath)) {
        const directImage = await readLocalImageFile(localPath, source);
        if (directImage) return directImage;
    } else {
        console.warn(`跳过超出导入目录的图片：${source}`);
    }

    const fallbackPath = await findLocalImageByBasename(source, sourceContext);
    if (fallbackPath) return await readLocalImageFile(fallbackPath, source);

    console.warn(`未找到本地图片，保留原引用：${source}`);
    return null;
}

async function readLocalImage(source, sourceContext) {
    return await readLocalImageAuto(source, sourceContext);
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

    const assetsDirName = postSlug;
    const assetsDir = path.join(publicPostAssetsDir, assetsDirName);
    const replacements = [];
    let index = 1;

    for (const match of body.matchAll(imagePattern)) {
        const [fullMatch, alt, rawTarget] = match;
        const { source, suffix } = parseImageTarget(rawTarget);
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
            to: `![${alt}](/assets/posts/${assetsDirName}/${filename}${suffix})`,
        });
        index += 1;
    }

    let nextBody = body;
    for (const item of replacements) {
        nextBody = nextBody.replace(item.from, item.to);
    }
    return nextBody;
}

function encodeUnresolvedImageTarget(source, suffix) {
    if (source.includes(" ") || source.includes("(") || source.includes(")")) {
        return `<${source}>${suffix}`;
    }
    return `${source}${suffix}`;
}

function normalizeRemainingImageTargets(body) {
    return body.replace(imagePattern, (fullMatch, alt, rawTarget) => {
        const { source, suffix } = parseImageTarget(rawTarget);

        if (
            !source ||
            source.startsWith("#") ||
            source.startsWith("data:") ||
            source.startsWith("mailto:") ||
            source.startsWith("/assets/") ||
            /^https?:\/\//i.test(source)
        ) {
            return fullMatch;
        }

        const normalizedSource = cleanLocalImageSource(source);
        return `![${alt}](${encodeUnresolvedImageTarget(normalizedSource, suffix)})`;
    });
}

function katexCanRender(content, displayMode) {
    try {
        katex.renderToString(content, {
            displayMode,
            throwOnError: true,
            strict: "warn",
        });
        return true;
    } catch {
        return false;
    }
}

function stripTrailingSingleBackslash(line) {
    const trimmed = line.replace(/[ \t]+$/g, "");
    const slashMatch = trimmed.match(/\\+$/);
    if (!slashMatch || slashMatch[0].length % 2 === 0) return line;
    return trimmed.slice(0, -1).replace(/[ \t]+$/g, "").replace(/,\s*$/g, ",");
}

function balanceLatexBraces(content) {
    let balance = 0;
    for (let index = 0; index < content.length; index += 1) {
        const char = content[index];
        const escaped = index > 0 && content[index - 1] === "\\";
        if (escaped) continue;
        if (char === "{") balance += 1;
        if (char === "}") balance -= 1;
    }

    if (balance > 0) return `${content}${"}".repeat(balance)}`;
    return content;
}

function repairMathContent(content) {
    const withoutDangerousLineEndings = content
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map(stripTrailingSingleBackslash)
        .join("\n")
        .trim();

    return balanceLatexBraces(withoutDangerousLineEndings);
}

function normalizeMathBlocks(body) {
    return body.replace(/\$\$\r?\n([\s\S]*?)\r?\n\$\$/g, (match, content) => {
        const normalizedContent = repairMathContent(content);
        if (!katexCanRender(normalizedContent, true)) {
            console.warn(`块级公式仍无法渲染，已保留 $$ 边界：${normalizedContent.slice(0, 120)}`);
        }

        return `$$\n${normalizedContent}\n$$`;
    });
}

function normalizeInlineMath(body) {
    return body.replace(/\\\(([\s\S]*?)\\\)/g, (match, content) => {
        const normalizedContent = repairMathContent(content);
        if (!katexCanRender(normalizedContent, false)) {
            console.warn(`行内公式仍无法渲染，已保留 $ 边界：${normalizedContent.slice(0, 120)}`);
        }

        return `$${normalizedContent}$`;
    });
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
const title = normalizeTitle(inputs.title || parsed.data.title || extractTitle(parsed.body));
const slug = slugify(inputs.slug || parsed.data.routeName || title);
const published = toDateString(inputs.published || parsed.data.published || nowDate);
const filename = `${published}-${slug}.md`;
const outputPath = path.join(postsDir, filename);

let body = parsed.body.trimStart();
body = normalizeMathBlocks(body);
body = normalizeInlineMath(body);
body = await downloadImages(body, sourceContext, slug);
body = normalizeRemainingImageTargets(body);

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
