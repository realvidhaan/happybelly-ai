// Optional persistence layer. The shipped app runs on browser storage and does
// NOT import this file, so the project builds & runs without a database. Wire this
// into your own API routes once DATABASE_URL points at a Postgres/Supabase instance
// and you've run `npm run db:generate`.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
