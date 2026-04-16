import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlFile = path.join(__dirname, "../drizzle/0005_early_wind_dancer.sql");
const rawSql = fs.readFileSync(sqlFile, "utf-8");

// Split on drizzle's statement separator
const statements = rawSql
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

const conn = await mysql.createConnection(process.env.DATABASE_URL);

for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    console.log("✓", stmt.slice(0, 80).replace(/\n/g, " "));
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_TABLE_EXISTS_ERROR") {
      console.log("⚠ already exists, skipping:", stmt.slice(0, 60).replace(/\n/g, " "));
    } else {
      console.error("✗ FAILED:", stmt.slice(0, 80).replace(/\n/g, " "));
      console.error("  Error:", err.message);
    }
  }
}

await conn.end();
console.log("\nMigration complete.");
