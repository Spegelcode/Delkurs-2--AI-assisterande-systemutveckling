import { execFile } from "node:child_process";
import path from "node:path";
import { Result, ok, err } from "../result";

export type Price = { net: string; vat: string; total: string };

const SCRIPT = path.join(__dirname, "..", "legacy", "price_calc.py");
const PYTHON = process.platform === "win32" ? "python" : "python3";

// Brygga till den äldre prisberäkningen i Python. Allt pris räknas fortfarande där.
export function calcPrice(orderId: number): Promise<Result<Price>> {
  return new Promise((resolve) => {
    execFile(PYTHON, [SCRIPT, String(orderId)], { env: process.env }, (error, stdout) => {
      if (error) {
        resolve(err("not_found", `Pris för beställning ${orderId} kunde inte räknas.`));
        return;
      }
      resolve(ok(JSON.parse(stdout) as Price));
    });
  });
}
