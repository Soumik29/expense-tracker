import { prisma } from "../db.js";

// Idempotent, in-app schema sync for environments where we can't run the
// Prisma CLI on deploy (the Render service starts `node dist/index.js`
// directly, bypassing package.json's start script). Each step checks
// information_schema first, so running this on every boot is a fast no-op
// once the database is up to date. Local/dev environments stay on
// `prisma db push`; this must be kept in sync with schema.prisma.

const columnInfo = async (
  table: string,
  column: string,
): Promise<{ exists: boolean; maxLength: number | null }> => {
  const rows = await prisma.$queryRawUnsafe<
    { CHARACTER_MAXIMUM_LENGTH: bigint | number | null }[]
  >(
    `SELECT CHARACTER_MAXIMUM_LENGTH
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    table,
    column,
  );
  const first = rows[0];
  if (!first) return { exists: false, maxLength: null };
  const len = first.CHARACTER_MAXIMUM_LENGTH;
  return { exists: true, maxLength: len === null ? null : Number(len) };
};

const tableExists = async (table: string): Promise<boolean> => {
  const rows = await prisma.$queryRawUnsafe<{ TABLE_NAME: string }[]>(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    table,
  );
  return rows.length > 0;
};

export const ensureSchema = async (): Promise<void> => {
  // 1. Widen description columns to VARCHAR(500)
  for (const table of ["Expense", "Income"]) {
    const desc = await columnInfo(table, "description");
    if (desc.exists && desc.maxLength !== null && desc.maxLength < 500) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE \`${table}\` MODIFY \`description\` VARCHAR(500) NULL`,
      );
      console.log(`[schema] Widened ${table}.description to VARCHAR(500)`);
    }
  }

  // 2. Add lastRecurredAt for the recurring-transaction engine
  for (const table of ["Expense", "Income"]) {
    const col = await columnInfo(table, "lastRecurredAt");
    if (!col.exists) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE \`${table}\` ADD COLUMN \`lastRecurredAt\` DATETIME(3) NULL`,
      );
      console.log(`[schema] Added ${table}.lastRecurredAt`);
    }
  }

  // 3. Budget table (matches what `prisma db push` generates)
  if (!(await tableExists("Budget"))) {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE \`Budget\` (
        \`id\` INTEGER NOT NULL AUTO_INCREMENT,
        \`category\` ENUM('Food','Groceries','Mobile_Bill','Travel','Shopping','Games','Subscription','EMI') NOT NULL,
        \`amount\` DECIMAL(10, 2) NOT NULL,
        \`userId\` INTEGER NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        UNIQUE INDEX \`Budget_userId_category_key\`(\`userId\`, \`category\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log("[schema] Created Budget table");
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE \`Budget\` ADD CONSTRAINT \`Budget_userId_fkey\`
         FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`)
         ON DELETE CASCADE ON UPDATE CASCADE`,
      );
    } catch (fkError) {
      // Some hosted MySQL flavors (e.g. Vitess-based) reject foreign keys;
      // the app enforces ownership in code, so this is non-fatal.
      console.warn("[schema] Could not add Budget FK (non-fatal):", fkError);
    }
  }
};

export default ensureSchema;
