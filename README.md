# Expense Tracker

A simple expense tracker project which I'm making for my own sake to keep track of my expenses.

---

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
- This imports Tialwinds's styles.

### Run the project

- npm run dev

