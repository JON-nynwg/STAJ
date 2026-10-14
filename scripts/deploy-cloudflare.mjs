import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const config = JSON.parse(readFileSync(new URL("../wrangler.cloudflare.json", import.meta.url), "utf8"));
if (config.d1_databases[0].database_id === "00000000-0000-4000-8000-000000000000") {
  throw new Error("Configure your own database first: pnpm cf:database YOUR_DATABASE_ID");
}
for (const args of [["build:cloudflare"], ["exec", "wrangler", "deploy", "--config", "dist/server/wrangler.json"]]) {
  const result = spawnSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
