// Builds the Tauri updater manifest (`latest.json`) from a directory of
// bundles produced by `cargo tauri build`. Each platform entry points at the
// archive the updater installs (.app.tar.gz / NSIS .exe / AppImage), not at
// the plain .dmg/.deb downloads.
/* global console, process */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [tag, artifactsDir] = process.argv.slice(2);
if (!tag || !artifactsDir) {
  console.error("usage: node update-manifest.mjs <tag> <artifacts-dir>");
  process.exit(1);
}

const config = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
const { version, productName } = config;
const owner = "bilals2008";
const repo = "QuickPrompt";

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function platformKey(file) {
  const name = file.toLowerCase();
  if (name.endsWith(".exe") || name.endsWith(".msi")) {
    return name.includes("aarch64") || name.includes("arm64")
      ? "windows-aarch64"
      : "windows-x86_64";
  }
  if (name.endsWith(".app.tar.gz")) {
    return name.includes("x64") || name.includes("x86_64")
      ? "darwin-x86_64"
      : "darwin-aarch64";
  }
  if (name.endsWith(".appimage")) return "linux-x86_64";
  return null;
}

// Prefer the archive the updater consumes when both an installer and a plain
// download exist for the same platform.
const RANK = { ".app.tar.gz": 3, ".exe": 3, ".appimage": 3, ".msi": 2, ".dmg": 1, ".deb": 1 };

const entries = new Map();
for (const file of walk(artifactsDir)) {
  const key = platformKey(file);
  if (!key) continue;
  const rank = Object.entries(RANK).find(([ext]) => file.toLowerCase().endsWith(ext))?.[1] ?? 0;
  const current = entries.get(key);
  if (!current || rank > current.rank) {
    entries.set(key, { file, rank });
  }
}

const platforms = {};
for (const [key, { file }] of entries) {
  const signaturePath = `${file}.sig`;
  let signature;
  try {
    signature = readFileSync(signaturePath, "utf8").trim();
  } catch {
    console.error(`missing signature for ${file}`);
    process.exit(1);
  }
  platforms[key] = {
    url: `https://github.com/${owner}/${repo}/releases/download/${tag}/${file.split(/[\\/]/).pop()}`,
    signature,
  };
}

const manifest = {
  version,
  notes: `${productName} ${version}`,
  pub_date: new Date().toISOString(),
  platforms,
};

writeFileSync(join(artifactsDir, "latest.json"), JSON.stringify(manifest, null, 2));
console.log(`latest.json: ${Object.keys(platforms).join(", ")}`);
