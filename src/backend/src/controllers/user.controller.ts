import Send from "@utils/response.utils.js";
import { prisma } from "../db.js";
import bcrypt from "bcrypt";
import RagService from "../services/rag.service.js";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";

class UserController {
  static getUser = async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!user) {
        return Send.notFound(res, {}, "User not found");
      }
      return Send.success(res, { user });
    } catch (error) {
      console.error("Error fetching user info:", error);
      return Send.error(res, {}, "Internal server error");
    }
  };

  // Delete the signed-in user's own account and all their data. Requires the
  // account password in the body as confirmation, since this is irreversible.
  static deleteAccount = async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      if (!userId) return Send.unauthorized(res, null);

      const { password } = req.body ?? {};
      if (!password || typeof password !== "string") {
        return Send.badRequest(
          res,
          null,
          "Password confirmation is required to delete the account",
        );
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return Send.notFound(res, null, "User not found");

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        return Send.forbidden(res, null, "Incorrect password");
      }

      // Best-effort cleanup of this user's vectors in the AI index — the DB
      // cascade below removes the rows, but the index is external.
      try {
        const [expenses, incomes] = await Promise.all([
          prisma.expense.findMany({ where: { userId }, select: { id: true } }),
          prisma.income.findMany({ where: { userId }, select: { id: true } }),
        ]);
        for (const { id } of expenses) {
          await RagService.deleteIndexedExpense(id);
        }
        for (const { id } of incomes) {
          await RagService.deleteIndexedIncome(id);
        }
      } catch (aiError) {
        console.error("Failed to clean AI index during account deletion:", aiError);
      }

      // Cascades to expenses, incomes, and budgets (onDelete: Cascade)
      await prisma.user.delete({ where: { id: userId } });

      const isProduction = process.env.NODE_ENV === "production";
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? ("none" as const) : ("lax" as const),
      };
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);

      return Send.success(res, null, "Account deleted");
    } catch (error) {
      console.error("Failed to delete account:", error);
      return Send.error(res, null, "Failed to delete account");
    }
  };
}

export default UserController;
