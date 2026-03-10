import Send from "@utils/response.utils.js";
import { prisma } from "../db.js";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";

// Helper to get User ID from request (since middleware attaches it)
const getUserId = (req: Request): number | null => {
  const authReq = req as AuthenticatedRequest;
  return authReq.userId ?? null;
};

class IncomeController {
  // 1. GET ALL INCOMES
  static getIncomes = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return Send.unauthorized(res, null);

      const incomes = await prisma.income.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      });

      return Send.success(res, incomes);
    } catch (error) {
      console.error("Error fetching incomes:", error);
      return Send.error(res, null, "Failed to fetch incomes");
    }
  };

  // 2. CREATE INCOME
  static createIncome = async (req: Request, res: Response) => {
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

      if (!amount || !date || !category) {
        return Send.badRequest(res, {
          message: "Amount, Date, and Category are required",
        });
      }

      const createdIncome = await prisma.income.create({
        data: {
          category,
          amount: Number(amount),
          date: new Date(date),
          description: description || "",
          userId,
          isRecurring: isRecurring || false,
          paymentMethod: paymentMethod || "CASH",
        },
      });

      return Send.success(res, { income: createdIncome });
    } catch (error) {
      console.error("Failed to create income: ", error);
      return Send.error(res, null, "Failed to create income");
    }
  };

  // 3. DELETE INCOME
  static deleteIncome = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { incomeId } = req.params;

      if (!userId) return Send.unauthorized(res, null);

      const income = await prisma.income.findUnique({
        where: { id: Number(incomeId) },
      });

      if (!income || income.userId !== userId) {
        return Send.forbidden(
          res,
          null,
          "You are not authorized to delete this income",
        );
      }

      await prisma.income.delete({
        where: { id: Number(incomeId) },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Failed to delete income:", error);
      return Send.error(res, null, "Failed to delete income");
    }
  };

  // 4. UPDATE INCOME
  static updateIncome = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { incomeId } = req.params;
      const {
        amount,
        date,
        category,
        description,
        isRecurring,
        paymentMethod,
      } = req.body;

      if (!userId) return Send.unauthorized(res, null);

      const existing = await prisma.income.findUnique({
        where: { id: Number(incomeId) },
      });

      if (!existing || existing.userId !== userId) {
        return Send.forbidden(
          res,
          null,
          "Not authorized to update this income",
        );
      }

      const updatedIncome = await prisma.income.update({
        where: { id: Number(incomeId) },
        data: {
          amount: Number(amount),
          date: new Date(date),
          category,
          description,
          isRecurring: isRecurring || false,
          paymentMethod: paymentMethod || "CASH",
        },
      });

      return Send.success(res, { income: updatedIncome });
    } catch (error) {
      console.error("Failed to update income:", error);
      return Send.error(res, null);
    }
  };
}

export default IncomeController;

