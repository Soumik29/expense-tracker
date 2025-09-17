import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

let expenses = [
  {
    id: 1,
    category: "Groceries",
    amount: 50.25,
    description: "Weekly grocery run",
    date: "2024-09-15T00:00:00.000Z",
  },
  {
    id: 2,
    category: "Food",
    amount: 15.5,
    description: "Lunch with a friend",
    date: "2024-09-14T00:00:00.000Z",
  },
];

app.get("/expenses", (req, res) => {
  res.json(expenses);
});

app.post("/expenses", (req, res) => {
  const newExpense = { ...req.body, id: Date.now() };
  expenses.push(newExpense);
  res.status(201).json(newExpense);
});

app.put("/expenses/:id", (req, res) => {
  const expenseID = Number(req.params.id);
  const updatedExpense = req.body;
  const findExpenseToUpdate = expenses.findIndex(
    (expense) => expense.id === expenseID
  );
  if (findExpenseToUpdate !== -1) {
    expenses[findExpenseToUpdate] = { ...updatedExpense, id: expenseID };
    res.status(200).json(expenses[findExpenseToUpdate]);
  } else {
    res.status(400).send("Item not found!");
  }
});

app.delete("/expenses/:id", (req, res) => {
    const expenseID = Number(req.params.id);
    const expenseIndex = expenses.findIndex((expense) => expense.id === expenseID);
    if(expenseIndex !== -1){
      expenses.splice(expenseIndex, 1);
      res.status(204).send();
    }else{
      res.status(404).send("Item not found!");
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
