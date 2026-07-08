# Expense Tracker 💸

A full-stack expense and income tracking application built with React, TypeScript, Node.js, and MySQL — with a built-in AI assistant that can chat about anything, answer exact questions about your spending, and remember the conversation.

![ExpenseTracker Logo](https://github.com/Soumik29/expense-tracker/blob/main/src/assets/Logo/ExpenseTrackerLogo.png)

---

## 📖 About

Expense Tracker helps you manage your personal finances by tracking every expense and income you record. Beyond CRUD and charts, it has a genuine AI financial assistant — not a canned FAQ bot — built as a tool-calling agent that queries your real data for exact answers instead of guessing, can hold a normal conversation, and remembers the last few turns of a chat.

### What You Can Do

- 📝 **Track Expenses & Income** - Add records with category, amount, date, description, and payment method
- 🤖 **Ask the AI Assistant** - "What's my most recent expense?", "How much did I spend on Food in total?", "What do I spend the most on?" — answered with exact numbers, not estimates
- 💬 **Chat Normally, Too** - The same assistant can answer general questions and hold a multi-turn conversation, not just expense lookups
- 📷 **Scan Receipts** - Snap a photo of a receipt and have the total auto-extracted via OCR
- 🔍 **Search & Filter** - Find records by text, category, payment method, date range, or amount
- 📊 **Visualize Data** - View spending breakdown with interactive bar charts
- 📅 **Date Presets** - Quick filters for Today, Last 7 Days, This Month, etc.
- 👤 **User Accounts** - Secure registration and login with JWT authentication (httpOnly cookies, refresh-token rotation)
- 🔄 **Recurring Expenses** - Mark expenses as recurring for tracking subscriptions

---

## ✨ Features

### Core Tracking

- **Add, Edit & Delete Expenses and Income** - Full CRUD operations with a clean modal interface
- **Smart Search** - Search by description or category name in real-time
- **Advanced Filtering** - Filter by category, payment method, amount range, date range, and recurring status
- **Date Range Presets** - 9 preset options (Today, Yesterday, Last 7/30 Days, This/Last Week/Month, This Year)
- **Expense Grouping** - Group expenses by Day, Week, or Month
- **Interactive Charts** - Bar charts showing spending by category or payment method

### AI Financial Assistant

- **Real tool-calling agent, not prompt-stuffing** - The assistant has dedicated tools for exact lookups (`getRecentTransactions`), exact sums (`getCategoryTotal`), balance calculation (`getBalance`), category ranking/trends (`getSpendingBreakdown`), and semantic search (`searchTransactions`) — it decides which to call per question rather than the app pre-fetching a fixed context window every time
- **General conversation** - Ask it anything, not just about your expenses; it only reaches for a financial tool when the question is actually about your money
- **Conversation memory** - Follow-up questions like "what about that?" resolve correctly using the last several turns of the conversation
- **Per-user data isolation** - Every tool is scoped to your account server-side; there is no way for the assistant to see another user's data

### Receipt Scanning

- **Client-side OCR** via Tesseract.js — extracts the total directly from a photographed receipt, handling multiple currencies and both US/European number formats

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** [React 19](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Build Tool:** [Vite 7](https://vitejs.dev/)
- **Charts:** [Chart.js](https://www.chartjs.org/)
- **OCR:** [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Markdown rendering:** [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm (for the AI chat)
- **Icons:** [Heroicons](https://heroicons.com/), [Font Awesome](https://fontawesome.com/)
- **Routing:** [React Router 7](https://reactrouter.com/)

### Backend

- **Runtime:** [Node.js](https://nodejs.org/) 18+
- **Framework:** [Express 5](https://expressjs.com/)
- **Database:** [MySQL](https://www.mysql.com/)
- **ORM:** [Prisma 6](https://www.prisma.io/)
- **Authentication:** JWT (Access + Refresh Tokens, httpOnly cookies, bcrypt-hashed passwords/refresh tokens)
- **Validation:** [Zod](https://zod.dev/)

### AI / RAG Stack

- **Orchestration:** [LangChain.js](https://js.langchain.com/) (`createAgent` tool-calling agent)
- **LLM:** [Groq](https://groq.com/) (`openai/gpt-oss-20b`)
- **Embeddings:** [Google Gemini](https://ai.google.dev/) (`gemini-embedding-001`)
- **Vector Database:** [Pinecone](https://www.pinecone.io/)

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MySQL](https://www.mysql.com/) database server
- [Docker](https://www.docker.com/) (optional, for running MySQL via Docker)
- API keys for [Groq](https://console.groq.com/), [Google Gemini](https://ai.google.dev/), and [Pinecone](https://www.pinecone.io/) (only required for the AI assistant feature — the rest of the app works without them)

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/Soumik29/expense-tracker.git
   cd expense-tracker
   ```

2. **Install frontend dependencies:**

   ```sh
   npm install
   ```

3. **Install backend dependencies:**

   ```sh
   cd src/backend
   npm install
   cd ../..
   ```

4. **Set up environment variables:**

   Create a single `.env` file in the **project root** (not `src/backend/`) — both the frontend build and the backend server read from this file:

   ```env
   # MySQL (used by Docker Compose and DATABASE_URL — use literal values, not ${VAR} references)
   MYSQL_ROOT_PASSWORD="your-root-password"
   MYSQL_DATABASE="expense_tracker"
   MYSQL_USER="your-mysql-user"
   MYSQL_PASSWORD="your-mysql-password"
   DATABASE_URL="mysql://your-mysql-user:your-mysql-password@localhost:3306/expense_tracker"

   # Auth secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   AUTH_SECRET="your-access-token-secret"
   AUTH_REFRESH_SECRET="your-refresh-token-secret"

   # AI assistant (optional — omit to run without the AI feature)
   GROQ_API_KEY="your-groq-api-key"
   GEMINI_API_KEY="your-gemini-api-key"
   PINECONE_API_KEY="your-pinecone-api-key"
   PINECONE_INDEX="your-pinecone-index-name"
   ```

5. **Start MySQL via Docker Compose** (from project root):

   ```sh
   docker-compose up -d
   ```

6. **Run database migrations:**

   ```sh
   cd src/backend
   npx prisma migrate deploy
   npx prisma generate
   cd ../..
   ```

### Running the App

**Option 1: Run both servers together (recommended)**

```sh
# From project root
npm run dev:full
```

**Option 2: Run separately**

Terminal 1 - Backend:

```sh
cd src/backend
npm run dev
```

Terminal 2 - Frontend:

```sh
# From project root
npm run dev
```

### Access the App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000

---

## 🧪 Benchmarks

Both the OCR receipt parser and the AI assistant have automated benchmark suites — real, reproducible accuracy numbers, not just claims:

```sh
# Receipt parser: 31 real-world receipt formats, no external services needed
npm run bench:receipts

# AI assistant: 21 questions covering exact lookups, aggregation, trends,
# general conversation, and multi-turn memory — requires the AI env vars above
cd src/backend
npm run bench:rag
```

Results are written to `benchmarks/` as versioned Markdown/JSON reports.

---

## 📁 Project Structure

```
expense-tracker/
├── src/
│   ├── auth/              # Login & Register pages
│   ├── backend/           # Express.js API server
│   │   ├── prisma/        # Database schema & migrations
│   │   ├── src/
│   │   │   ├── controllers/   # Route handlers
│   │   │   ├── middlewares/   # Auth & validation
│   │   │   ├── routes/        # API routes
│   │   │   ├── services/      # RagService (AI agent) + financial assistant tools
│   │   │   ├── rag-benchmark.ts   # AI assistant benchmark script
│   │   │   └── utils/         # Helper functions
│   ├── components/        # React components (incl. FinancialAssistant chat UI)
│   ├── context/           # Auth context & provider
│   ├── services/          # API service layer
│   └── utils/             # Custom hooks
├── benchmarks/             # Benchmark run reports (receipt parser + AI assistant)
├── docs/                   # Feature docs, deployment guides, and engineering playbooks
├── public/                # Static assets
└── package.json
```

---

## 🔌 API Endpoints

| Method | Endpoint              | Description                        |
| ------ | --------------------- | ----------------------------------- |
| POST   | `/api/auth/register`  | Register a new user (issues a session immediately) |
| POST   | `/api/auth/login`     | Login and get tokens                |
| POST   | `/api/auth/logout`    | Logout and clear tokens             |
| POST   | `/api/auth/refresh`   | Refresh access token                |
| GET    | `/api/user/info`      | Get current user info               |
| GET    | `/api/expenses`       | Get all expenses                    |
| POST   | `/api/expenses`       | Create new expense                  |
| PUT    | `/api/expenses/:id`   | Update expense                      |
| DELETE | `/api/expenses/:id`   | Delete expense                      |
| GET    | `/api/income`         | Get all income records              |
| POST   | `/api/income`         | Create new income record            |
| PUT    | `/api/income/:id`     | Update income record                |
| DELETE | `/api/income/:id`     | Delete income record                |
| POST   | `/api/chat`           | Ask the AI assistant a question (accepts optional conversation `history`) |

---

## 🚀 Deployment

Want to deploy this app for free? We have comprehensive deployment guides for different hosting strategies:

### Option 1: All-in-One Free Hosting (Recommended for Beginners)

📖 **[Railway Deployment Guide](./docs/RAILWAY_DEPLOYMENT_GUIDE.md)** - Deploy everything (frontend, backend, database & Docker) in one place:

- **Railway** - Host frontend, backend, MySQL database, and Docker containers all in one dashboard
- **$5 free credit/month** - Perfect for personal projects and prototypes
- **Simple setup** - Everything in one place, no complex configuration

🚀 **Quick Start:** [Railway Quick Start Checklist](./docs/RAILWAY_QUICK_START.md) - Step-by-step checklist (~35-40 minutes)

### Option 2: Unlimited Free Tier (Best for Production)

📖 **[Multi-Platform Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Split deployment across specialized platforms:

- **Vercel** (Frontend) - Unlimited bandwidth
- **Render** (Backend) - 750 hours/month
- **PlanetScale** (MySQL Database) - 5GB storage
- **More scalable** - Better for high-traffic applications

---

## 📚 Documentation

For detailed feature documentation, see:

- [Bug Fix Report](./docs/BUGFIX_REPORT.md) - Architecture improvements and bug fixes
- [Search & Filter Feature](./docs/SEARCH_FILTER_FEATURE.md) - Implementation tutorial
- [Date Range Filter](./docs/DATE_RANGE_FILTER_FEATURE.md) - Date presets implementation
- [Railway Deployment Guide](./docs/RAILWAY_DEPLOYMENT_GUIDE.md) - All-in-one free hosting (Recommended)
- [Multi-Platform Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Unlimited free tier deployment

### Engineering Playbooks

The AI assistant was built and hardened in documented, step-by-step stages — each with real errors hit, root causes, and verified fixes, not just a summary of the end state:

- [Agentic RAG Upgrade Plan](./docs/AGENTIC_RAG_UPGRADE_PLAN.md) and [Steps 1-4](./docs/AGENTIC_RAG_PLAYBOOK_STEP1_TOOLS.md) - Moving from a fixed-context-window chain to a tool-calling agent capable of exact aggregation
- [General Chat Upgrade Plan](./docs/GENERAL_CHAT_UPGRADE_PLAN.md) and [Steps 1-4](./docs/GENERAL_CHAT_PLAYBOOK_STEP1_SYSTEM_PROMPT.md) - Adding general conversation, spending-trend questions, and multi-turn memory
- [Live App Testing Playbook](./docs/LIVE_APP_TESTING_PLAYBOOK.md) - End-to-end browser verification that found and fixed 3 real auth/env bugs invisible to script-only testing
- [Chat UI Redesign Playbook](./docs/CHAT_UI_REDESIGN_PLAYBOOK.md) - Full-screen layout and markdown rendering for the chat widget
- [Simple Guide (plain English)](./docs/SIMPLE_GUIDE_RAG_CHANGES_AND_GENERAL_CHAT.md) - A non-technical explanation of what the AI assistant does and why

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Happy Tracking! 💰
