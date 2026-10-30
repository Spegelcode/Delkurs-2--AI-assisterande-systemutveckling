const fs = require("node:fs");

let input = process.argv.slice(2).join(" ");
try {
  if (!process.stdin.isTTY) input += fs.readFileSync(0, "utf8");
} catch {
  // Manuell körning utan stdin är tillåten.
}

const forbidden = [
  /\bgit\s+push\b/i,
  /\bgit\s+remote\s+(?:add|set-url|rename)\b/i,
  /\bgh\s+(?:pr|repo)\s+(?:create|clone)\b/i,
];

if (forbidden.some((pattern) => pattern.test(input))) {
  console.error(
    "[command-guard] Kommando stoppat: extern publicering eller repo-koppling är förbjuden i den lokala kurskopian.",
  );
  process.exit(2);
}

console.log("[command-guard] Kommando godkänt.");
