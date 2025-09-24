import { PrismaClient } from "@prisma/client";
import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import { PrismaAdapter } from "@auth/prisma-adapter";
import jwt from "jsonwebtoken";
import { ExpressAuth } from "@auth/express";
import cors from "cors";
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
// const allowCrossOrigin = cors({
//   origin: process.env.CLIENT_ORIGIN,
//   credentials: true,
// });

// app.use(function(req, res, next){
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });
// app.use(allowCrossOrigin);
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET_KEY;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRE;
const prisma = new PrismaClient();

function signinToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function authenticate(req, res, next) {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      req.user = null;
      return next();
    }

    req.user = { id: user.id, username: user.username, name: user.name };
    return next();
  } catch (err) {
    req.user = null;
    return next();
  }
}

app.use(authenticate);

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.post("/register", async (req, res) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || null,
      },
    });
    const { password: _, ...publicUser } = user;
    res.status(201).json(publicUser);
  } catch (err) {
    console.log("Registration Failed", err);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid Credentials" });

    const token = signinToken({ id: user.id, username: user.username });

    const cookieOptions = {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("token", token, cookieOptions);
    const { password: _, ...publicUser } = user;
    res.json({ user: publicUser });
  } catch (err) {
    console.log("Login failed:", err);
    res.status(500).json({ error: "Login Failed" });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ ok: true });
});

app.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, name: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Failed to fetch current user:", err);
    res.status(500).json({ error: "Failed to fetch current user" });
  }
});

app.set("trust proxy", true);
app.use(
  "/auth",
  ExpressAuth({ providers: [], adapter: PrismaAdapter(prisma) })
);

async function postExpenses(req, res) {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Please log in to add expenses" });
    }

    const { category, amount, date, description } = req.body;

    // Validate required fields
    if (amount == null || !date) {
      return res
        .status(400)
        .json({ error: "Amount and date are required fields" });
    }

    // Validate category against enum values
    const validCategories = [
      "Food",
      "Groceries",
      "Mobile_Bill",
      "Travel",
      "Shopping",
      "Games",
      "Subscription",
      "EMI",
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: "Invalid category",
        validCategories,
        receivedCategory: category,
      });
    }

    // Validate amount is a valid number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res
        .status(400)
        .json({ error: "Amount must be a positive number" });
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Please use YYYY-MM-DD" });
    }

    const userExpense = await prisma.expense.create({
      data: {
        category,
        amount: amountNum,
        date: dateObj,
        description: description || null,
        userId: req.user.id,
      },
    });

    res.status(201).json(userExpense);
  } catch (err) {
    console.error("Failed to create expense:", err);

    // Handle Prisma errors
    if (err.code === "P2002") {
      return res.status(400).json({
        error: "Validation error",
        details: "This expense already exists",
      });
    }

    res.status(500).json({
      error: "Failed to create expense",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

app.post("/expenses", requireAuth, postExpenses);
app.get("/expenses", requireAuth, async (req, res) => {
  try {
    const getUserExpenses = await prisma.expense.findMany({
      where: { userId: req.user.id },
    });
    res.status(200).json(getUserExpenses);
  } catch (err) {
    console.log("Failed to fetch expenses: ", err);
    res.status(400).json({ error: "Failed to fetch expenses" });
  }
});
app.put("/expenses/:id", requireAuth, async (req, res) => {
  try {
    const expenseIdToUpdate = Number(req.params.id);
    const existing = await prisma.expense.findUnique({
      where: { id: expenseIdToUpdate },
    });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: "Expense not found" });
    }
    const { category, amount, date, description } = req.body;
    const prismaUpdateFunc = await prisma.expense.update({
      where: { id: expenseIdToUpdate },
      data: {
        category: category ?? existing.category,
        amount: amount != null ? parseFloat(amount) : existing.amount,
        date: date ? new Date(date) : existing.date,
        description: description ?? existing.description,
      },
    });
    res.status(200).json(prismaUpdateFunc);
  } catch (err) {
    console.log("Something went wrong. Couldn't update expense ", err);
    res.status(400).json({ error: "Could not update expense." });
  }
});
app.delete("/expenses/:id", requireAuth, async (req, res) => {
  const expenseToDeleteId = Number(req.params.id);
  const existing = await prisma.expense.findUnique({
    where: { id: expenseToDeleteId },
  });
  if (!existing || existing.userId !== req.user.id) {
    return res.status(404).json({ error: "Expense not found" });
  }
  try {
    const deleteExpense = await prisma.expense.delete({
      where: { id: expenseToDeleteId },
    });
    res.status(204).send();
  } catch (err) {
    console.log("Something went wrong,", err);
    res
      .status(500)
      .json({ error: "Couldn't delete expense. Expense is not found." });
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
