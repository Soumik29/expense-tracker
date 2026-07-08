import Send from "@utils/response.utils.js";
import { prisma } from "../db.js";
import { Category } from "@prisma/client";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";

const isExpenseCategory = (value: string): value is Category =>
  Object.values(Category).includes(value as Category);

// Helper to get User ID from request (since middleware attaches it)
const getUserId = (req: Request): number | null => {
  const authReq = req as AuthenticatedRequest;
  return authReq.userId ?? null;
};

class BudgetController {
  // 1. GET ALL BUDGETS
  static getBudgets = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return Send.unauthorized(res, null);

      const budgets = await prisma.budget.findMany({
        where: { userId },
        orderBy: { category: "asc" },
      });

      return Send.success(res, budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      return Send.error(res, null, "Failed to fetch budgets");
    }
  };

  // 2. UPSERT BUDGET — one budget per (user, category), so setting a
  // category that already has a budget overwrites its amount.
  static upsertBudget = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return Send.unauthorized(res, null);

      const { category, amount } = req.body;

      const budget = await prisma.budget.upsert({
        where: { userId_category: { userId, category } },
        update: { amount },
        create: { userId, category, amount },
      });

      return Send.success(res, { budget });
    } catch (error) {
      console.error("Failed to save budget:", error);
      return Send.error(res, null, "Failed to save budget");
    }
  };

  // 3. DELETE BUDGET (by category, since that's the natural key the UI has)
  static deleteBudget = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return Send.unauthorized(res, null);

      const { category } = req.params;
      if (!category || !isExpenseCategory(category)) {
        return Send.badRequest(res, null, "Invalid expense category");
      }

      const existing = await prisma.budget.findUnique({
        where: { userId_category: { userId, category } },
      });
      if (!existing) {
        return Send.notFound(res, null, "No budget set for this category");
      }

      await prisma.budget.delete({ where: { id: existing.id } });

      return res.status(204).send();
    } catch (error) {
      console.error("Failed to delete budget:", error);
      return Send.error(res, null, "Failed to delete budget");
    }
  };
}

export default BudgetController;
