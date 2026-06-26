import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw Object.assign(
      new Error("DATABASE_URL nao configurada. Defina a variavel de ambiente DATABASE_URL."),
      { status: 500 },
    );
  }

  const isServerless = process.env.VERCEL === "1";
  const enableQueryLogs =
    process.env.PRISMA_QUERY_LOG === "1" || process.env.NODE_ENV === "development";
  const pool = new Pool({
    connectionString: databaseUrl,
    max: isServerless ? 1 : 10,
    idleTimeoutMillis: isServerless ? 10_000 : 30_000,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: enableQueryLogs ? ["query", "warn", "error"] : ["warn", "error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
