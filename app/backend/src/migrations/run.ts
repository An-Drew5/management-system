import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "arrow_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

async function run(): Promise<void> {
  await client.connect();
  console.log("Connected to database");

  // Ensure migrations tracking table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = path.resolve(__dirname);
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const { rows } = await client.query(
      "SELECT 1 FROM _migrations WHERE filename = $1",
      [file],
    );

    if (rows.length > 0) {
      console.log(`  skip  ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [
        file,
      ]);
      await client.query("COMMIT");
      console.log(`  apply ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Migration failed on ${file}: ${(err as Error).message}`);
    }
  }

  console.log("All migrations applied.");
  await client.end();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
