import { execSync } from "child_process";

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

async function bootstrap() {
  if (!check("docker info")) {
    console.error("Docker is not running. Start Docker and try again.");
    process.exit(1);
  }

  run("docker compose up -d", "Starting postgres + redis");

  console.log("[bootstrap] Waiting for services...");
  let retries = 15;
  while (retries > 0) {
    if (
      check('docker compose exec -T postgres pg_isready -U mo') &&
      check('docker compose exec -T redis redis-cli ping')
    ) {
      break;
    }
    retries--;
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (retries === 0) {
    console.error("Services did not become ready in time.");
    process.exit(1);
  }

  run("pnpm db:push", "Pushing schema to database");
  run("pnpm --filter @mo/database seed", "Seeding database");

  console.log("\n[bootstrap] Ready:");
  console.log("  PostgreSQL: postgresql://mo:mo@localhost:5432/mo");
  console.log("  Redis:      redis://localhost:6379");
  console.log("  Run:        pnpm dev");
}

bootstrap();
