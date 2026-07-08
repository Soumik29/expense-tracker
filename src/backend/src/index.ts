import "tsconfig-paths/register.js";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import path from "path";
import { fileURLToPath } from "url";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (three levels up from src/backend/src).
// dotenv-expand resolves ${VAR} references (e.g. DATABASE_URL referencing
// MYSQL_USER/MYSQL_PASSWORD) — plain dotenv leaves them as literal,
// unexpanded text, which breaks the Prisma connection string at runtime.
dotenvExpand.expand(dotenv.config({ path: path.resolve(__dirname, "../../../.env") }));

import App from "./app.js";
const app = new App();

app.start();
