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

- Root component of ExpenseTracker project

### ExpenseTracker.tsx

- The ExpenseTracker component handles the main logic of the app. It handles a list of expenses, it has the logic to edit the expenses, it also has the logic to add and delete expenses. It also handles the logic for displaying a modal when a user tries to edit an expense.

### AddExpenseForm.tsx

- AddExpenseForm component handles the logic of adding an expense. It has all the validation logic of the form. None of the fields not allowed to stay empty. 

### ExpenseCard.tsx

- The expense card component shows individual expenses in a card form. It will display details such as the date of the expense made, the category of expense, the expense amount, and the expense description.

## TotalExpenses.tsx

- As the file name says, this component is responsible to calculate the total expense.

### ModalFormExpense.tsx

- This component handles editing of the expenses. When a user edits an expense (pen icon ✏️), the modal form will show up where the user can edits if they made some mistake in the expense.

## types.ts

- This file defines the types for the Expense such as the id should be number, the amount should be number, the description should be of string type and so on.

