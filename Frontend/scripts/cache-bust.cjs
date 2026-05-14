#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGET_EXTENSIONS = new Set([".html", ".css"]);

function timestampVersion() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${min}`;
}

const argVersion = process.argv.find((arg) => arg.startsWith("--version="));
const version = argVersion ? argVersion.split("=")[1] : timestampVersion();

function isLocalUrl(url) {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("#")
  ) {
    return false;
  }
  return true;
}

function withVersion(url, token) {
  const [base, hash = ""] = url.split("#");
  const [pathname, query = ""] = base.split("?");
  const params = new URLSearchParams(query);
  params.set("v", token);
  const next = `${pathname}?${params.toString()}`;
  return hash ? `${next}#${hash}` : next;
}

function getPathname(url) {
  const [base] = url.split("#");
  const [pathname] = base.split("?");
  return pathname || "";
}

function isStaticAssetPath(url) {
  const pathname = getPathname(url).trim();
  if (!pathname) return false;

  // Scope strictly to local static assets only.
  if (/^(?:\.\/|\/)?assets\//i.test(pathname)) return true;
  if (/^favicon\.(png|ico|svg)$/i.test(pathname)) return true;
  return false;
}

function removeVersionParam(url) {
  const [base, hash = ""] = url.split("#");
  const [pathname, query = ""] = base.split("?");
  if (!query) return url;
  const params = new URLSearchParams(query);
  params.delete("v");
  const nextQuery = params.toString();
  const nextBase = nextQuery ? `${pathname}?${nextQuery}` : pathname;
  return hash ? `${nextBase}#${hash}` : nextBase;
}

function splitScriptBlocks(html) {
  return html.split(/(<script\b[\s\S]*?<\/script>)/gi);
}

function cleanScriptBlockVersions(scriptBlock) {
  return scriptBlock.replace(/\?v=\d{8,14}/g, "");
}

function cleanPageLinksInHtml(html) {
  return html.replace(
    /\b(href)=["']([^"']+)["']/gi,
    (full, attr, rawUrl) => {
      if (!isLocalUrl(rawUrl)) return full;
      const pathname = getPathname(rawUrl);
      const isPageLink =
        pathname === "/" || /\.html?$/i.test(pathname) || pathname === "";
      if (!isPageLink) return full;
      return `${attr}="${removeVersionParam(rawUrl)}"`;
    }
  );
}

function updateAssetRefs(content, token) {
  let updated = content;

  // HTML attributes: href/src/poster
  updated = updated.replace(
    /\b(href|src|poster)=["']([^"']+)["']/gi,
    (full, attr, rawUrl) => {
      if (!isLocalUrl(rawUrl)) return full;
      if (!isStaticAssetPath(rawUrl)) return full;
      const nextUrl = withVersion(rawUrl, token);
      return `${attr}="${nextUrl}"`;
    }
  );

  // CSS import/url() references
  updated = updated.replace(
    /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi,
    (full, quote, rawUrl) => {
      if (!isLocalUrl(rawUrl)) return full;
      const nextUrl = withVersion(rawUrl, token);
      const q = quote || "";
      return `url(${q}${nextUrl}${q})`;
    }
  );

  return updated;
}

function walk(dir, result = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walk(fullPath, result);
      continue;
    }
    if (TARGET_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      result.push(fullPath);
    }
  }
  return result;
}

const files = walk(ROOT);
let changedCount = 0;

for (const filePath of files) {
  const before = fs.readFileSync(filePath, "utf8");
  let after;

  if (path.extname(filePath).toLowerCase() === ".html") {
    const parts = splitScriptBlocks(before);
    after = parts
      .map((part) => {
        if (/^<script\b/i.test(part)) {
          return cleanScriptBlockVersions(part);
        }
        return updateAssetRefs(cleanPageLinksInHtml(part), version);
      })
      .join("");
  } else {
    after = updateAssetRefs(before, version);
  }

  if (after !== before) {
    fs.writeFileSync(filePath, after, "utf8");
    changedCount += 1;
  }
}

console.log(`Cache bust version: ${version}`);
console.log(`Files updated: ${changedCount}`);
