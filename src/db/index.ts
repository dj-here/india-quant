import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Cache connections across serverless lambdas
neonConfig.fetchConnectionCache = true;

const connectionString = process.env.DATABASE_URL || "";

export const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

/**
 * Executes a database operation with automatic retry to handle Neon cold-start wakeups.
 */
export async function withDbRetry<T>(operation: () => Promise<T>, retries = 2, delayMs = 600): Promise<T> {
  try {
    return await operation();
  } catch (err: any) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
      return withDbRetry(operation, retries - 1, delayMs * 1.5);
    }
    throw err;
  }
}
