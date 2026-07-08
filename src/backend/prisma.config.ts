import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import path from "path";
import { fileURLToPath } from "url";

// With a prisma.config.ts present, the Prisma CLI no longer auto-loads .env.
// Load the project-root .env (two levels up from src/backend) with
// dotenv-expand so ${VAR} references inside DATABASE_URL resolve, matching
// how src/index.ts loads it for the running server.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvExpand.expand(
  dotenv.config({ path: path.resolve(__dirname, "../../.env") }),
);

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
