import Send from "@utils/response.utils.js";
import { prisma } from "../db.js";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import authConfig from "@config/auth.config.js";
import { decode } from "punycode";
const { verify } = jwt;
const secret = authConfig.secret as string;
interface DecodedToken {
  userId: number;
}
class ExpenseController {
  static userExpense = async (req: Request, res: Response) => {
    const token = req.cookies.accessToken;
    if (!token) {
      Send.unauthorized(res, null);
    }
    try {
      const decodedToken = verify(token, secret) as DecodedToken;
      (req as any).userId = decodedToken;
      const { amount, date, category, description } = req.body;
      if (amount == null || !date) {
        Send.badRequest(res, { message: "Amount and Date needs to be filled" });
      }
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
        return Send.badRequest(res, {
          error: "Invalid Category",
          validCategories: validCategories,
          receivedCategory: category,
        });
      }

      const amountNum = Number(amount);
      if (!amountNum || amountNum <= 0) {
        return Send.badRequest(res, {
          message: "Amount can't be empty or a negative number",
          receivedAmount: amountNum,
        });
      }

      const validateDate = new Date(date);
      if (isNaN(validateDate.getTime())) {
        return Send.badRequest(res, {
          message: "Invalid date format. Please use YYYY-MM-DD",
        });
      }

      const createExpense = await prisma.expense.create({
        data: {
          category,
          amount: amountNum,
          date: validateDate,
          description: description || null,
          userId: req.body.userId,
        },
      });
      return Send.success(res, {
        category: category,
        amount: amountNum,
        date: validateDate,
        description: description || null,
        userId: req.body.userId,
      });
    } catch (error) {
        console.error("Failed to create expense: ", error);
        Send.error(res, null);
    }
  };
}
