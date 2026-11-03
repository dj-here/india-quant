const fs = require('fs');
const path = require('path');

const prismaDir = path.resolve(__dirname, '../packages/db/prisma');
const schemaTarget = path.join(prismaDir, 'schema.prisma');
const pgSchema = path.join(prismaDir, 'schema.postgresql.prisma');
const sqliteSchema = path.join(prismaDir, 'schema.sqlite.prisma');

const dbUrl = (process.env.DATABASE_URL || '').trim();

if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  console.log('[Prisma Sync] Detected PostgreSQL DATABASE_URL. Applying PostgreSQL schema...');
  fs.copyFileSync(pgSchema, schemaTarget);
} else {
  if (fs.existsSync(sqliteSchema)) {
    console.log('[Prisma Sync] Local or SQLite mode. Applying SQLite schema...');
    fs.copyFileSync(sqliteSchema, schemaTarget);
  }
}
