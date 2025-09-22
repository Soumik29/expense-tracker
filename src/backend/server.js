import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;
const prisma = new PrismaClient();

// function bigIntToString(obj){
//   return JSON.parse(
//     JSON.stringify(obj, (key, value) => {
//       typeof value === 'bigint' ? value.toString() : value;
//     })
//   );
// }

async function postExpenses(req, res) {
  const userExpense = await prisma.expense.create({
    data: { ...req.body },
  });
  res.json(userExpense);
}

app.post("/expenses", postExpenses);
app.get("/expenses", async (req, res) => {
  try {
    const getUserExpenses = await prisma.expense.findMany();
    res.status(200).json(getUserExpenses);
  } catch (err) {
    console.log("Failed to fetch expenses: ", err);
    res.status(400).json({ error: "Failed to fetch expenses" });
  }
});
app.put("/expenses/:id", async (req, res) => {
  try {
    const expenseIdToUpdate = Number(req.params.id);
    const { category, amount, date, description } = req.body;
    const prismaUpdateFunc = await prisma.expense.update({
      where: { id: expenseIdToUpdate },
      data: {
        category,
        amount,
        date: new Date(date),
        description,
      },
    });
    res.status(200).json(prismaUpdateFunc);
  } catch (err) {
    console.log("Something went wrong. Couldn't update expense ", err);
    res.status(400).json({ error: "Could not update expense." });
  }
});
app.delete("/expenses/:id", async (req, res) => {
  const expenseToDeleteId = Number(req.params.id);
  try {
    const deleteExpense = await prisma.expense.delete({
      where: { id: expenseToDeleteId },
    });
    res.status(204).json(deleteExpense);
  } catch (err) {
    console.log("Something went wrong,", err);
    res
      .status(400)
      .json({ error: "Couldn't delete expense. Expense is not found." });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { userName, password } = req.body;
    if(!userName || !password) return res.status(400).json({error: "Username and password required"});
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        userName,
        password: hashedPassword,
      },
    });
    res.status(201).json(user);
  } catch(err) {
    console.log("Registration Failed", err);
    res.status(500).json({error: "Could not create user"});
  }
});
// const prisma = new PrismaClient();
// async function main(){
//   const allExpenses = await prisma.expense.findMany();
//   console.log(allExpenses);
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   }).catch(async (e) => {
//     console.log(e);
//     await prisma.$disconnect();
//     process.exit(1);
// });

// let expenses = [
//   {
//     id: 1,
//     category: "Groceries",
//     amount: 50.25,
//     description: "Weekly grocery run",
//     date: "2024-09-15T00:00:00.000Z",
//   },
//   {
//     id: 2,
//     category: "Food",
//     amount: 15.5,
//     description: "Lunch with a friend",
//     date: "2024-09-14T00:00:00.000Z",
//   },
// ];

// app.get("/expenses", (req, res) => {
//   res.json(expenses);
// });

// app.post("/expenses", (req, res) => {
//   const newExpense = { ...req.body, id: Date.now() };
//   expenses.push(newExpense);
//   res.status(201).json(newExpense);
// });

// app.put("/expenses/:id", (req, res) => {
//   const expenseID = Number(req.params.id);
//   const updatedExpense = req.body;
//   const findExpenseToUpdate = expenses.findIndex(
//     (expense) => expense.id === expenseID
//   );
//   if (findExpenseToUpdate !== -1) {
//     expenses[findExpenseToUpdate] = { ...updatedExpense, id: expenseID };
//     res.status(200).json(expenses[findExpenseToUpdate]);
//   } else {
//     res.status(400).send("Item not found!");
//   }
// });

// app.delete("/expenses/:id", (req, res) => {
//     const expenseID = Number(req.params.id);
//     const expenseIndex = expenses.findIndex((expense) => expense.id === expenseID);
//     if(expenseIndex !== -1){
//       expenses.splice(expenseIndex, 1);
//       res.status(204).send();
//     }else{
//       res.status(404).send("Item not found!");
//     }
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
