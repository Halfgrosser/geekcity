import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceUrl = "https://cloud.mave.digital/34811";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "data/episodes.js");
const xml = process.env.MAVE_RSS_FILE
  ? await readFile(process.env.MAVE_RSS_FILE, "utf8")
  : await loadFeed(sourceUrl);

const channel = xml.replace(/<item>[\s\S]*$/u, "");
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gu)].map((match) => match[1]);
const episodes = items
  .map((item) => ({
    guid: tag(item, "guid"),
    number: tag(item, "itunes:episode"),
    title: tag(item, "title"),
    publication: toIsoDate(tag(item, "pubDate")),
    link: tag(item, "link"),
    duration: Number(tag(item, "itunes:duration")) || null,
  }))
  .filter((episode) => episode.title && episode.publication)
  .sort((left, right) => left.publication.localeCompare(right.publication));

if (episodes.length < 90) {
  throw new Error(`Only ${episodes.length} episodes parsed; refusing to overwrite data`);
}

const payload = {
  source: sourceUrl,
  title: tag(channel, "title"),
  cover: attribute(channel, "itunes:image", "href"),
  updatedAt: toIsoDate(tag(channel, "lastBuildDate")) || new Date().toISOString().slice(0, 10),
  episodes,
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `window.__TRIKO_DATA__ = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
console.log(`Saved ${episodes.length} episodes to ${output}`);

async function loadFeed(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "geekcity-hiatus-chart/1.0" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`Mave RSS returned ${response.status}`);
  return response.text();
}

function tag(source, name) {
  const match = source.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "u"));
  return cleanXml(match?.[1] || "");
}

function attribute(source, name, attributeName) {
  const match = source.match(new RegExp(`<${name}[^>]*\\s${attributeName}="([^"]+)"[^>]*>`, "u"));
  return decodeEntities(match?.[1] || "");
}

function cleanXml(value) {
  return decodeEntities(value.replace(/^<!\[CDATA\[/u, "").replace(/\]\]>$/u, "").trim());
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/&#(\d+);/gu, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/giu, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function toIsoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
}
