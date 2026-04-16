import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "../drizzle/0007_stiff_jackal.sql"), "utf-8");

const conn = await createConnection(process.env.DATABASE_URL);
const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);

for (const stmt of statements) {
  console.log("Executing:", stmt.slice(0, 80) + "...");
  await conn.execute(stmt);
}

console.log(`✓ Migration 0007 applied (${statements.length} statements)`);
await conn.end();
