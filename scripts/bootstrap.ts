import { execSync } from "child_process";

const DB_URL = process.env.DATABASE_URL ?? "postgresql://mo:mo@127.0.0.1:5432/mo";

function run(cmd: string, label: string) {
  console.log(`[bootstrap] ${label}...`);
  execSync(cmd, { stdio: "inherit" });
}

function check(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function query(sql: string, db = "postgres"): string {
  return execSync(`psql -h 127.0.0.1 -d ${db} -tAc "${sql}"`, { stdio: "pipe" })
    .toString()
    .trim();
}

function bootstrap() {
  if (!check("pg_isready -h 127.0.0.1 -p 5432")) {
    console.error("PostgreSQL is not running on 127.0.0.1:5432.");
    console.error("Start it with: brew services start postgresql@14");
    process.exit(1);
  }

  if (!check("redis-cli -h 127.0.0.1 -p 6379 ping")) {
    console.error("Redis is not running on 127.0.0.1:6379.");
    console.error("Start it with: brew services start redis");
    process.exit(1);
  }

  if (!check(`psql "${DB_URL}" -tAc "select 1"`)) {
    const url = new URL(DB_URL);
    const role = url.username;
    const dbName = url.pathname.slice(1);
    if (!check(`psql -h 127.0.0.1 -d postgres -tAc "select 1"`)) {
      console.error(`Cannot connect to ${DB_URL} nor to postgres as the current user.`);
      console.error(`Create the role and database manually: CREATE ROLE ${role} LOGIN PASSWORD '...'; CREATE DATABASE ${dbName} OWNER ${role};`);
      process.exit(1);
    }
    if (query(`SELECT 1 FROM pg_roles WHERE rolname='${role}'`) !== "1") {
      run(`psql -h 127.0.0.1 -d postgres -c "CREATE ROLE ${role} LOGIN PASSWORD '${url.password}'"`, `Creating role ${role}`);
    }
    if (query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`) !== "1") {
      run(`psql -h 127.0.0.1 -d postgres -c "CREATE DATABASE ${dbName} OWNER ${role}"`, `Creating database ${dbName}`);
    }
  }

  run("pnpm db:push", "Pushing schema to database");

  const userCount = execSync(`psql "${DB_URL}" -tAc "SELECT count(*) FROM users"`, { stdio: "pipe" })
    .toString()
    .trim();
  if (userCount === "0") {
    run("pnpm --filter @mo/database seed", "Seeding database");
  } else {
    console.log(`[bootstrap] Database already has ${userCount} users, skipping seed`);
  }

  console.log("\n[bootstrap] Ready:");
  console.log(`  PostgreSQL: ${DB_URL}`);
  console.log("  Redis:      redis://127.0.0.1:6379");
  console.log("  Run:        pnpm dev");
}

bootstrap();
