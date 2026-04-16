import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const sql = readFileSync(new URL("../drizzle/0006_productive_warhawk.sql", import.meta.url), "utf8");

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const statements = sql.split(";").map(s => s.trim()).filter(Boolean);
for (const stmt of statements) {
  await conn.execute(stmt);
  console.log("✓", stmt.slice(0, 60));
}
await conn.end();
console.log("Migration 0006 aplicada com sucesso.");
