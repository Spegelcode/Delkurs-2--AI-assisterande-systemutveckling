const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "..");
const testRoot = path.join(root, "tests");
const forbidden = /\b(?:describe|it|test|specify)\.(?:skip|only)\b|\b(?:xdescribe|xit|xtest)\b/;

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const deletedTests = execFileSync("git", ["diff", "--cached", "--name-status", "--", "tests"], {
  cwd: root,
  encoding: "utf8",
}).split(/\r?\n/).filter((line) => /^D\s/.test(line));

const skippedTests = walk(testRoot).filter((file) => forbidden.test(fs.readFileSync(file, "utf8")));

if (deletedTests.length || skippedTests.length) {
  console.error("[test-integrity] Commit stoppad: tester får inte tas bort, hoppas över eller göras exklusiva.");
  for (const item of deletedTests) console.error(`  borttagen testfil: ${item}`);
  for (const file of skippedTests) console.error(`  förbjudet testmönster: ${path.relative(root, file)}`);
  process.exit(2);
}

console.log("[test-integrity] Testskydd godkänt.");
