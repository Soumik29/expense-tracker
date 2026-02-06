import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "@routes/auth.routes.js";
import appConfig from "@config/app.config.js";
import userRoutes from "@routes/user.routes.js";
// FIX 1: Import the Router, not the Controller
import expenseRoutes from "@routes/expense.routes.js";

class App {
  private app: Express;
  constructor() {
    this.app = express();
    this.initMiddlewares();
    this.initRoutes();
  }

  private initMiddlewares() {
    this.app.use(express.json());
    this.app.use(cookieParser());

    // CORS configuration for production
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.FRONTEND_URL, // Production frontend URL
    ].filter(Boolean) as string[];

    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, curl, etc.)
          if (!origin) return callback(null, true);

          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        methods: ["GET", "POST", "DELETE", "PUT"],
        credentials: true,
      }),
    );
  }

  private initRoutes() {
    // Health check endpoint for deployment
    this.app.get("/api/health", (req, res) => {
      res
        .status(200)
        .json({ status: "ok", timestamp: new Date().toISOString() });
    });

    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/user", userRoutes);

    // FIX 2: Register the router at the correct PLURAL path
    this.app.use("/api/expenses", expenseRoutes);
  }

  public start() {
    let { port, host } = appConfig;
    if (host !== undefined) {
      host = host;
    } else {
      host = "localhost";
    }
    this.app.listen(port, host, () => {
      console.log(`Server is running on http://${host}:${port}`);
    });
  }
}

export default App;
