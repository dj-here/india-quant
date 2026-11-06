import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, index, bigint } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  nickname: text("nickname").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).defaultNow().notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
});

export const saves = pgTable("saves", {
  playerId: uuid("player_id").references(() => players.id, { onDelete: "cascade" }).primaryKey(),
  version: integer("version").default(1).notNull(),
  dataJson: jsonb("data_json").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const runs = pgTable("runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  playerId: uuid("player_id").references(() => players.id, { onDelete: "set null" }),
  nickname: text("nickname").notNull(),
  mode: text("mode").notNull(), // "standard" | "daily" | "endless"
  seed: bigint("seed", { mode: "number" }).notNull(),
  characterId: text("character_id").notNull(),
  arenaId: text("arena_id").notNull(),
  score: integer("score").notNull(),
  durationMs: integer("duration_ms").notNull(),
  kills: integer("kills").notNull(),
  levelReached: integer("level_reached").notNull(),
  stardustEarned: integer("stardust_earned").default(0).notNull(),
  buildJson: jsonb("build_json").notNull(),
  inputLogHash: text("input_log_hash"),
  verified: boolean("verified").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    scoreIdx: index("runs_score_idx").on(table.score),
    modeIdx: index("runs_mode_idx").on(table.mode),
    createdAtIdx: index("runs_created_at_idx").on(table.createdAt),
    verifiedScoreIdx: index("runs_verified_score_idx").on(table.verified, table.mode, table.score),
  };
});

export const dailyChallenges = pgTable("daily_challenges", {
  date: text("date").primaryKey(), // YYYY-MM-DD
  seed: bigint("seed", { mode: "number" }).notNull(),
  modifiersJson: jsonb("modifiers_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const playerAchievements = pgTable("player_achievements", {
  id: uuid("id").defaultRandom().primaryKey(),
  playerId: uuid("player_id").references(() => players.id, { onDelete: "cascade" }).notNull(),
  achievementKey: text("achievement_key").notNull(),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    playerAchievementIdx: index("player_achievement_idx").on(table.playerId, table.achievementKey),
  };
});

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").references(() => runs.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
