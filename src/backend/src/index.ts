import "tsconfig-paths/register.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up from src/backend/src)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import App from "./app.js";
const app = new App();

app.start();
