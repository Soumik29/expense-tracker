# Expense Tracker

A A simple expense tracker project for myself.

## Features

- Add a new expense
- View a list of all expenses
- See the total expenses
- Styled with Tailwind CSS

---

## Tech Stack

- [React] - UI Library
- [TypeScript] - Type-safe JavaScript
- [Tailwind CSS] - Utility-first CSS Framework
- [Vite] - Fast Frontend Build Tool

---

## Getting Started

### 1. Clone the repo

```
  git clone https://github.com/username/expense-tracker.git
  cd expense-tracker
```

### Install Dependencies

- npm create vite@latest expense-tracker
- npm install

## Add tailwindcss

- npm install tailwindcss @tailwindcss/vite
- npx tailwindcss init -p

* The -p flag creates both tailwind.config.js and postcss.config.js

## Add Tailwind config

- open tailwind.config.js file and add:

```
  content: [
    "./index.html",
    "./src/**/*.{js,ts.jsx,tsx}",
  ],
```

- then open src/index.css and repalce everything with:

```
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
```

- This imports Tialainds's styles.

### Run the project

- npm run dev

### main.tsx

- This is where all our program starts

### App.tsx

- App.tsx is the parent component of all other components.
- Each component is a child of this component.
- Think of this as the head of a family
- Our app.tsx contains a heading and then a child component called ExpenseTracker.tsx

### ExpenseTracker.tsx

- The ExpenseTracker component handles the main logic of the app. It handles a list of expenses, it has the logic to edit the expenses, it also has the logic to add and delete expenses. It also handles the logic for displaying a modal when a user tries to edit an expense.
