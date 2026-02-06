# Expense Tracker 💸

A full-stack expense tracking application built with React, TypeScript, Node.js, and MySQL. Track your daily expenses with powerful filtering, beautiful charts, and secure user authentication.

![ExpenseTracker Logo](https://github.com/Soumik29/expense-tracker/blob/input/src/assets/Logo/ExpenseTrackerLogo.png)

---

## 📖 About

Expense Tracker helps you manage your personal finances by tracking every expense you make. With features like category filtering, date range presets, and visual analytics, you'll always know where your money goes.

### What You Can Do

- 📝 **Track Expenses** - Add expenses with category, amount, date, and payment method
- 🔍 **Search & Filter** - Find expenses by text, category, payment method, date range, or amount
- 📊 **Visualize Data** - View spending breakdown with interactive bar charts
- 📅 **Date Presets** - Quick filters for Today, Last 7 Days, This Month, etc.
- 👤 **User Accounts** - Secure registration and login with JWT authentication
- 🔄 **Recurring Expenses** - Mark expenses as recurring for tracking subscriptions

---

## ✨ Features

- **Add, Edit & Delete Expenses** - Full CRUD operations with a clean modal interface
- **Smart Search** - Search by description or category name in real-time
- **Advanced Filtering** - Filter by category, payment method, amount range, date range, and recurring status
- **Date Range Presets** - 9 preset options (Today, Yesterday, Last 7/30 Days, This/Last Week/Month, This Year)
- **Expense Grouping** - Group expenses by Day, Week, or Month
- **Interactive Charts** - Bar charts showing spending by category or payment method
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Modern UI** - Clean, minimalist design with Tailwind CSS

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** [React 18](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Charts:** [Chart.js](https://www.chartjs.org/)
- **Icons:** [Heroicons](https://heroicons.com/)
- **Routing:** [React Router](https://reactrouter.com/)

### Backend

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MySQL](https://www.mysql.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** JWT (Access + Refresh Tokens)

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MySQL](https://www.mysql.com/) database server
- [Docker](https://www.docker.com/) (optional, for running MySQL via Docker)

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
   ```

4. **Set up the database:**

   Create a `.env` file in `src/backend/`:

   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/expense_tracker"
   JWT_SECRET="your-secret-key"
   JWT_REFRESH_SECRET="your-refresh-secret-key"
   ```

   Or use Docker Compose (from project root):

   ```sh
   docker-compose up -d
   ```

5. **Run database migrations:**

   ```sh
   cd src/backend
   npx prisma migrate dev
   ```

6. **Generate Prisma client:**
   ```sh
   npx prisma generate
   ```

### Running the App

**Option 1: Run both servers together (recommended)**

```sh
# From project root
npm run dev:all
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
│   │   │   └── utils/         # Helper functions
│   ├── components/        # React components
│   ├── context/           # Auth context & provider
│   ├── services/          # API service layer
│   └── utils/             # Custom hooks
├── public/                # Static assets
└── package.json
```

---

## 🔌 API Endpoints

| Method | Endpoint             | Description             |
| ------ | -------------------- | ----------------------- |
| POST   | `/api/auth/register` | Register a new user     |
| POST   | `/api/auth/login`    | Login and get tokens    |
| POST   | `/api/auth/logout`   | Logout and clear tokens |
| POST   | `/api/auth/refresh`  | Refresh access token    |
| GET    | `/api/user/info`     | Get current user info   |
| GET    | `/api/expenses`      | Get all expenses        |
| POST   | `/api/expenses`      | Create new expense      |
| PUT    | `/api/expenses/:id`  | Update expense          |
| DELETE | `/api/expenses/:id`  | Delete expense          |

---

## � Deployment

Want to deploy this app for free? Check out the comprehensive deployment guide:

📖 **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Step-by-step instructions for deploying to:

- **Vercel** (Frontend)
- **Render** (Backend)
- **PlanetScale** (MySQL Database)

---

## 📚 Documentation

For detailed feature documentation, see:

- [Bug Fix Report](./BUGFIX_REPORT.md) - Architecture improvements and bug fixes
- [Search & Filter Feature](./SEARCH_FILTER_FEATURE.md) - Implementation tutorial
- [Date Range Filter](./DATE_RANGE_FILTER_FEATURE.md) - Date presets implementation
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Free hosting deployment tutorial

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Happy Tracking! 💰
