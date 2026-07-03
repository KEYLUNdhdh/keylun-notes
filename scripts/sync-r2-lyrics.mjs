import fs from "node:fs/promises";
import path from "node:path";
import musicPlayerConfig from "../src/content/music-player.json" with { type: "json" };

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, "public", "assets", "music", "r2-lyrics");
const publicBaseUrl = musicPlayerConfig.r2?.publicBaseUrl?.trim().replace(/\/+$/, "");

function r2LyricsPath(track) {
    return `r2-${String(track.id).replace(/[^a-zA-Z0-9_-]+/g, "-")}.lrc`;
}

function toR2Url(key) {
    const cleanKey = key.trim().replace(/^\/+/, "");
    return `${publicBaseUrl}/${cleanKey.split("/").map(encodeURIComponent).join("/")}`;
}

async function syncLyrics() {
    const playlist = musicPlayerConfig.local?.playlist ?? [];
    const tracks = playlist.filter((track) => track.r2LrcKey?.trim());

    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });

    if (!tracks.length) {
        console.log("No R2 lyric files configured.");
        return;
    }

    if (!publicBaseUrl) {
        throw new Error("R2 lyrics are configured, but music-player.json r2.publicBaseUrl is empty.");
    }

    for (const track of tracks) {
        const sourceUrl = toR2Url(track.r2LrcKey);
        const res = await fetch(sourceUrl);
        if (!res.ok) {
            throw new Error(`Failed to fetch R2 lyric for "${track.title}": ${res.status} ${sourceUrl}`);
        }

        const lrcText = await res.text();
        const outputPath = path.join(outputDir, r2LyricsPath(track));
        await fs.writeFile(outputPath, lrcText, "utf8");
        console.log(`Synced R2 lyric: ${track.title} -> ${path.relative(repoRoot, outputPath)}`);
    }
}

await syncLyrics();
