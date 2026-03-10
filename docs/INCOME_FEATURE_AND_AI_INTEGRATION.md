# Income Tracking & AI Integration

This document explains the **Income** feature added to the app and how it is integrated with the existing **RAG-powered AI financial assistant**.

It covers:

- Data model changes (Prisma)
- Backend API (Express controllers + routes)
- Frontend types, services, hooks, and UI
- How incomes are used in the AI assistant (Pinecone + LangChain)
- How to seed historical data into the vector store

---

## 1. Data Model (Prisma)

File: `src/backend/prisma/schema.prisma`

### 1.1 New `Income` model

We introduced a new `Income` model that mirrors the structure of `Expense`:

```prisma
model Income {
  id              Int             @id @default(autoincrement())
  amount          Decimal         @db.Decimal(10, 2)
  date            DateTime
  category        IncomeCategory
  description     String?
  userId          Int
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  isRecurring     Boolean         @default(false)
  paymentMethod   PaymentMethod   @default(CASH)
}
```

Key points:

- Each income belongs to a `User` (`userId` FK).
- Structure is intentionally parallel to `Expense` to keep backend/frontend logic simple and consistent.

### 1.2 User ↔ Income relationship

The `User` model now tracks incomes as well:

```prisma
model User {
  // ...
  expenses     Expense[]
  incomes      Income[]
}
```

### 1.3 New `IncomeCategory` enum

```prisma
enum IncomeCategory {
  Salary
  Freelance
  Investment
  Gift
  Other
}
```

This is separate from the `Category` enum used by expenses.

> **Deployment note:** For an existing database, we used `npx prisma db push --schema src/backend/prisma/schema.prisma` to apply these changes without dropping existing data.

---

## 2. Backend API (Express)

### 2.1 Controller: `IncomeController`

File: `src/backend/src/controllers/income.controller.ts`

This controller exposes full CRUD for incomes, scoped to the authenticated user:

- `getIncomes` – returns all incomes for the current user (sorted by date desc).
- `createIncome` – validates body, creates an income, and indexes it for AI.
- `updateIncome` – checks ownership, updates the income, and re-indexes it.
- `deleteIncome` – checks ownership, deletes the income, and removes it from the vector store.

Important snippets:

```ts
import RagService from "../services/rag.service.js";

// GET /api/incomes
const incomes = await prisma.income.findMany({
  where: { userId },
  orderBy: { date: "desc" },
});

// POST /api/incomes
const createdIncome = await prisma.income.create({ data: { ... } });
try {
  await RagService.indexIncome(createdIncome);
} catch (aiError) {
  console.error("Failed to create income for AI: ", aiError);
}

// DELETE /api/incomes/:incomeId
await prisma.income.delete({ where: { id: Number(incomeId) } });
try {
  await RagService.deleteIndexedIncome(Number(incomeId));
} catch (aiError) {
  console.error("Failed to delete indexed income for AI:", aiError);
}

// PUT /api/incomes/:incomeId
const updatedIncome = await prisma.income.update({ ... });
try {
  await RagService.indexIncome(updatedIncome);
} catch (aiError) {
  console.error("Failed to update income for AI: ", aiError);
}
```

All mutations gracefully degrade if the AI/vector indexing fails (your core DB operations still succeed).

### 2.2 Routes: `income.routes.ts`

File: `src/backend/src/routes/income.routes.ts`

```ts
import IncomeController from "@controllers/income.controller.js";
import BaseRouter, { type RouteConfig } from "./router.js";
import AuthMiddleware from "@middlewares/auth.middleware.js";

class IncomeRouter extends BaseRouter {
  protected routes(): RouteConfig[] {
    return [
      { method: "get", path: "/", middlewares: [AuthMiddleware.authenticateUser], handler: IncomeController.getIncomes },
      { method: "post", path: "/", middlewares: [AuthMiddleware.authenticateUser], handler: IncomeController.createIncome },
      { method: "put", path: "/:incomeId", middlewares: [AuthMiddleware.authenticateUser], handler: IncomeController.updateIncome },
      { method: "delete", path: "/:incomeId", middlewares: [AuthMiddleware.authenticateUser], handler: IncomeController.deleteIncome },
    ];
  }
}

export default new IncomeRouter().router;
```

### 2.3 App wiring: `app.ts`

File: `src/backend/src/app.ts`

```ts
import incomeRoutes from "@routes/income.routes.js";

// ...
this.app.use("/api/expenses", expenseRoutes);
this.app.use("/api/incomes", incomeRoutes);
this.app.use("/api/chat", chatRoutes);
```

The new income routes are mounted under `/api/incomes`.

---

## 3. Frontend: Types, Service, Hook, and UI

### 3.1 Types

File: `src/types.ts`

```ts
export type IncomeCategory = "Salary" | "Freelance" | "Investment" | "Gift" | "Other";

export type Income = {
  id: number;
  category: IncomeCategory;
  amount: number;
  description: string;
  date: string;
  isRecurring: boolean;
  paymentMethod: PaymentMethod;
  userId?: number;
};

export type newIncome = Omit<Income, "id">;
```

### 3.2 Service: `income.service.ts`

File: `src/services/income.service.ts`

This mirrors `expense.service.ts` but targets `/incomes`:

```ts
import api from "./api";
import type { Income, newIncome } from "../types";

interface IncomeResponse {
  income: Income;
}

export const incomeService = {
  async getAll(): Promise<Income[]> {
    const response = await api.get<Income[]>("/incomes");
    const incomes = Array.isArray(response.data) ? response.data : [];

    return incomes.map((inc) => ({
      ...inc,
      date: new Date(inc.date).toISOString(),
    }));
  },

  async create(income: newIncome): Promise<Income> { /* ... */ },
  async update(income: Income): Promise<Income> { /* ... */ },
  async delete(id: number): Promise<void> { /* ... */ },
};
```

### 3.3 Hook: `useIncomeCrud`

File: `src/utils/useIncomeCrud.tsx`

Equivalent to `useCrud` but for incomes:

- Loads incomes on mount (`incomeService.getAll`).
- Provides `addIncome`, `deleteIncome`, `updateIncome`.
- Normalizes `date` into ISO strings.

Example:

```ts
const { income, addIncome, deleteIncome, updateIncome, loading, error } =
  useIncomeCrud();
```

### 3.4 UI Components

All in `src/components`:

- `AddIncomeForm.tsx` – form to add new income (category, amount, description, date, payment method, recurring).
- `IncomeList.tsx` – simple list showing incomes with a delete button.
- `TotalIncome.tsx` – totals incomes and shows a green summary card.

These are wired into `ExpenseTracker.tsx`:

```tsx
import useIncomeCrud from "../utils/useIncomeCrud";
import AddIncomeForm from "./AddIncomeForm";
import IncomeList from "./IncomeList";
import TotalIncome from "./TotalIncome";

const {
  income,
  addIncome,
  deleteIncome,
} = useIncomeCrud();

// In JSX:
<div className="space-y-10">
  <AddExpenseForm onAddExpense={addExpense} />
  <AddIncomeForm onAddIncome={addIncome} />
</div>

<IncomeList incomes={income} onDeleteIncome={deleteIncome} />
{income.length > 0 && <TotalIncome incomes={income} />}
```

---

## 4. AI / RAG Integration for Incomes

The RAG pipeline now works with **both expenses and incomes**.

### 4.1 RAG service: `rag.service.ts`

File: `src/backend/src/services/rag.service.ts`

#### 4.1.1 Indexing expenses

The existing `indexExpense` method was updated to tag records as `"expense"`:

```ts
static async indexExpense(expense: Expense) {
  const semanticText = `On ${expense.date.toISOString().split("T")[0]}, I spent $${expense.amount} on ${expense.category}. Payment method: ${expense.paymentMethod}. ${expense.description ? `Description: ${expense.description}.` : ""}`;

  const vectorValues = await embeddings.embedQuery(semanticText);

  await pineconeIndex.upsert({
    records: [
      {
        id: expense.id.toString(),
        values: vectorValues,
        metadata: {
          expenseId: expense.id,
          userId: expense.userId,
          type: "expense",
          text: semanticText,
        },
      },
    ],
  });
}
```

#### 4.1.2 Indexing incomes

New method:

```ts
static async indexIncome(income: Income) {
  const semanticText = `On ${income.date.toISOString().split("T")[0]}, I earned $${income.amount} from ${income.category}. Payment method: ${income.paymentMethod}. ${income.description ? `Description: ${income.description}.` : ""}`;

  const vectorValues = await embeddings.embedQuery(semanticText);

  await pineconeIndex.upsert({
    records: [
      {
        id: `income:${income.id}`,
        values: vectorValues,
        metadata: {
          incomeId: income.id,
          userId: income.userId,
          type: "income",
          text: semanticText,
        },
      },
    ],
  });
}
```

Notes:

- Incomes are stored with IDs like `income:123` in Pinecone to avoid collisions with expense IDs.
- Metadata includes `type: "income"` or `"expense"` and the natural language `text` used as `pageContent`.

#### 4.1.3 Deletion helpers

```ts
static async deleteIndexedExpense(expenseId: number) {
  await pineconeIndex.deleteOne({ id: expenseId.toString() });
}

static async deleteIndexedIncome(incomeId: number) {
  await pineconeIndex.deleteOne({ id: `income:${incomeId}` });
}
```

#### 4.1.4 Retrieval and prompt

`askFinancialAssistant` now reasons over **both** incomes and expenses:

```ts
const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
  textKey: "text",
});

const results = await vectorStore.similaritySearch(question, 5, {
  userId: { $eq: userId },
});
```

The prompt was updated accordingly:

```ts
const prompt = PromptTemplate.fromTemplate(`
  You are a helpful financial assistant analyzing a user's income and expense tracker data.
  Answer the user's question using ONLY the provided context. If the answer is not in the context, say you don't know.
  
  Context (User's Expenses and Incomes):
  {context}
  
  Question: {question}
  Answer:
`);
```

This means:

- The AI sees both "I spent ..." and "I earned ..." sentences in the context.
- It can answer questions about **spending, earnings, or net position**, depending on the user’s question.

### 4.2 Seeding historical data

File: `src/backend/src/seed-vectors.ts`

We extended the seeding script so that it indexes both **existing expenses and incomes** into Pinecone:

```ts
const expenses = await prisma.expense.findMany();
const incomes = await prisma.income.findMany();

for (const expense of expenses) {
  await RagService.indexExpense(expense);
}

for (const income of incomes) {
  await RagService.indexIncome(income);
}
```

Run from `src/backend`:

```bash
cd src/backend
npx tsx src/seed-vectors.ts
```

This is optional but recommended if you had historical data before enabling RAG for incomes.

---

## 5. How Everything Fits Together

1. **User adds/updates/deletes an income** via the UI.
2. The frontend calls `/api/incomes` through `incomeService` and `useIncomeCrud`.
3. The backend:
   - Persists the income in MySQL via Prisma.
   - Calls `RagService.indexIncome` or `deleteIndexedIncome` to sync Pinecone.
4. When the user asks the **AI assistant** a question:
   - `ChatController` calls `RagService.askFinancialAssistant(userId, question)`.
   - `RagService` retrieves the top-matching vectors (both expenses and incomes) for that user.
   - The retrieved texts become context for the LLM (Groq), which generates a financial answer.

Result: your assistant can now reason about both **how you spend** and **how you earn**, instead of only seeing expenses.

