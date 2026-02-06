import Send from "@utils/response.utils.js";
import { prisma } from "../db.js";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";

// Helper to get User ID from request (since middleware attaches it)
const getUserId = (req: Request): number | null => {
  const authReq = req as AuthenticatedRequest;
  return authReq.userId ?? null;
};

class ExpenseController {
  // 1. GET ALL EXPENSES
  static getExpenses = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return Send.unauthorized(res, null);

      const expenses = await prisma.expense.findMany({
        where: { userId: userId },
        orderBy: { date: "desc" },
      });

      return Send.success(res, expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return Send.error(res, null, "Failed to fetch expenses");
    }
  };

  // 2. CREATE EXPENSE
  static createExpense = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return Send.unauthorized(res, null);

      const {
        amount,
        date,
        category,
        description,
        isRecurring,
        paymentMethod,
      } = req.body;

      // Basic Validation
      if (!amount || !date || !category) {
        return Send.badRequest(res, {
          message: "Amount, Date, and Category are required",
        });
      }

      const createExpense = await prisma.expense.create({
        data: {
          category,
          amount: Number(amount),
          date: new Date(date),
          description: description || "",
          userId: userId,
          isRecurring: isRecurring || false,
          paymentMethod: paymentMethod || "CASH",
        },
      });

      // Frontend expects { data: { expense: ... } }
      return Send.success(res, { expense: createExpense });
    } catch (error) {
      console.error("Failed to create expense: ", error);
      return Send.error(res, null, "Failed to create expense");
    }
  };

  // 3. DELETE EXPENSE
  static deleteExpense = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { expenseId } = req.params;

      if (!userId) return Send.unauthorized(res, null);

      // Verify ownership before deleting
      const expense = await prisma.expense.findUnique({
        where: { id: Number(expenseId) },
      });
      if (!expense || expense.userId !== userId) {
        return Send.forbidden(
          res,
          null,
          "You are not authorized to delete this expense",
        );
      }

      await prisma.expense.delete({
        where: { id: Number(expenseId) },
      });

      return res.status(204).send(); // 204 No Content is standard for delete
    } catch (error) {
      console.error("Failed to delete expense:", error);
      return Send.error(res, null, "Failed to delete expense");
    }
  };

  // 4. UPDATE EXPENSE
  static updateExpense = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { expenseId } = req.params;
      const {
        amount,
        date,
        category,
        description,
        isRecurring,
        paymentMethod,
      } = req.body;

      if (!userId) return Send.unauthorized(res, null);

      // Verify ownership
      const existing = await prisma.expense.findUnique({
        where: { id: Number(expenseId) },
      });
      if (!existing || existing.userId !== userId) {
        return Send.forbidden(
          res,
          null,
          "Not authorized to update this expense",
        );
      }

      const updatedExpense = await prisma.expense.update({
        where: { id: Number(expenseId) },
        data: {
          amount: Number(amount),
          date: new Date(date),
          category,
          description,
          isRecurring: isRecurring || false,
          paymentMethod: paymentMethod || "CASH",
        },
      });

      return Send.success(res, { expense: updatedExpense });
    } catch (error) {
      console.error("Failed to update expense:", error);
      return Send.error(res, null);
    }
  };
}

export default ExpenseController;
