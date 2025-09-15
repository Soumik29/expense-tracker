const express = require("express");
const app = express();
app.use(express.json());
const port = 3000;

let expenses = [
    { id: 1, category: "Groceries", amount: 50.25, description: "Weekly grocery run", date: "2024-09-15T00:00:00.000Z" },
    { id: 2, category: "Food", amount: 15.50, description: "Lunch with a friend", date: "2024-09-14T00:00:00.000Z" },
];

app.get("/", (req, res) => {
  res.send("HELLO, WORLD!");
});

app.get("/addExpense", (req, res) => {
  res.json(expenses);
});

app.post("/addExpense", (req, res) => {
  const newExpense = {...req.body, id: Date.now()};
  expenses.push(newExpense);
  res.status(201).json(newExpense);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
