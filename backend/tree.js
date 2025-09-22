#!/usr/bin/env node
// treegenerate.js
// Usage:
//   node treegenerate.js
//   node treegenerate.js --out tree.txt --depth 5 --exclude node_modules,uploads

const fs = require("fs");
const path = require("path");

const argv = require("minimist")(process.argv.slice(2), {
  string: ["out", "exclude"],
  alias: { o: "out", d: "depth", e: "exclude" },
  default: { out: "tree.txt", depth: 5, exclude: "node_modules,uploads,.git" },
});

const OUT_FILE = argv.out;
const MAX_DEPTH = parseInt(argv.depth, 10) || 5;
const EXCLUDE = new Set(
  (argv.exclude || "node_modules,uploads")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

function isExcluded(name) {
  return EXCLUDE.has(name);
}

function safeReaddir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return [];
  }
}

function linePrefix(level) {
  // simple prefix similar to the PowerShell indent used earlier
  // will produce sequences like "│   " repeated
  return "│   ".repeat(level) + "├── ";
}

function printTree(rootDir, maxDepth) {
  const lines = [];
  const now = new Date().toISOString().replace("T", " ").replace("Z", "Z ");
  lines.push(`${now}  Project tree (root: ${rootDir})`);
  lines.push(
    `Exclude: ${Array.from(EXCLUDE).join(", ")}; MaxDepth: ${maxDepth}`
  );
  lines.push("");

  // top-level entries
  const entries = safeReaddir(rootDir);
  const dirs = entries
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const files = entries
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .sort();

  function walk(dirPath, level) {
    if (level > maxDepth) return;

    const ents = safeReaddir(dirPath);
    const subDirs = ents
      .filter((e) => e.isDirectory())
      .map((d) => d.name)
      .sort();
    const subFiles = ents
      .filter((e) => e.isFile())
      .map((f) => f.name)
      .sort();

    for (const dname of subDirs) {
      if (isExcluded(dname)) continue;
      lines.push(linePrefix(level) + dname);
      walk(path.join(dirPath, dname), level + 1);
    }

    for (const fname of subFiles) {
      if (isExcluded(fname)) continue;
      lines.push(linePrefix(level) + fname);
    }
  }

  for (const d of dirs) {
    if (isExcluded(d)) continue;
    lines.push("├── " + d);
    walk(path.join(rootDir, d), 1);
  }

  for (const f of files) {
    if (isExcluded(f)) continue;
    lines.push("├── " + f);
  }

  lines.push("");
  lines.push(`Finished writing tree to ${OUT_FILE}`);
  return lines.join("\n");
}

function main() {
  const root = process.cwd();
  const treeTxt = printTree(root, MAX_DEPTH);
  fs.writeFileSync(OUT_FILE, treeTxt, { encoding: "utf8" });
  console.log(`Tree written to ${OUT_FILE}`);
}

main();
