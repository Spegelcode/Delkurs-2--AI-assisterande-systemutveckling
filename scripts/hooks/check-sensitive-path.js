const fs = require("node:fs");

const forbidden = [
  /(^|[\\/])\.env(?:$|[\\/])/i,
  /(^|[\\/])production([\\/]|$)/i,
  /customer[-_ ]?data/i,
  /personal[-_ ]?data/i,
  /secret|token|password/i,
];

let input = process.argv.slice(2).join(" ");
try {
  if (!process.stdin.isTTY) input += fs.readFileSync(0, "utf8");
} catch {
  // Manuell körning utan stdin är tillåten.
}

if (forbidden.some((pattern) => pattern.test(input))) {
  console.error("[path-guard] Ändring stoppad: sökvägen eller verktygsinmatningen kan innehålla skyddad data.");
  process.exit(2);
}

console.log("[path-guard] Sökväg godkänd.");
