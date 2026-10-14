import { readFileSync, writeFileSync } from "node:fs";
const id = process.argv[2];
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id ?? "") || id === "00000000-0000-4000-8000-000000000000") {
  throw new Error("Usage: pnpm cf:database YOUR_DATABASE_ID (copy the ID from Cloudflare).");
}
const path = new URL("../wrangler.cloudflare.json", import.meta.url);
const config = JSON.parse(readFileSync(path, "utf8"));
config.d1_databases[0].database_id = id;
writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
console.log("STAJ database configured. Apply migrations before deploying.");
