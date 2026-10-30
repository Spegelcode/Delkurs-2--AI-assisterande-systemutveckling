const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..", "..");
const sessions = path.join(root, "sessions");
const stateFile = path.join(sessions, "session-state.jsonl");

function latestSession() {
  return fs.readdirSync(sessions)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .at(-1);
}

function branch() {
  try {
    return execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const mode = process.argv[2] ?? "--load";
const latest = latestSession();

if (mode === "--load") {
  console.log(`[session-state] Senaste sessionslogg: ${latest ?? "ingen"}`);
  if (latest) {
    const preview = fs.readFileSync(path.join(sessions, latest), "utf8").split(/\r?\n/).slice(0, 8);
    console.log(preview.join("\n"));
  }
  process.exit(0);
}

if (mode === "--save") {
  fs.mkdirSync(sessions, { recursive: true });
  const record = {
    timestamp: new Date().toISOString(),
    branch: branch(),
    latestSession: latest ?? null,
  };
  fs.appendFileSync(stateFile, `${JSON.stringify(record)}\n`, "utf8");
  console.log(`[session-state] Sessionsläge sparat i ${path.relative(root, stateFile)}.`);
  process.exit(0);
}

console.error("Använd --load eller --save.");
process.exit(2);
