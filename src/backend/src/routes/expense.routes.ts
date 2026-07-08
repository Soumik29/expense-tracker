import ExpenseController from "@controllers/expenses.controller.js";
import BaseRouter, { type RouteConfig } from "./router.js";
import AuthMiddleware from "@middlewares/auth.middleware.js";
import ValidateMiddleware from "@middlewares/validation.middleware.js";
import transactionSchema from "../validations/transaction.schema.js";

class ExpenseRouter extends BaseRouter {
  protected routes(): RouteConfig[] {
    return [
      {
        method: "get",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: ExpenseController.getExpenses,
      },
      {
        method: "post",
        path: "/",
        middlewares: [
          AuthMiddleware.authenticateUser,
          ValidateMiddleware.validateBody(transactionSchema.expense),
        ],
        handler: ExpenseController.createExpense,
      },
      {
        method: "put",
        path: "/:expenseId",
        middlewares: [
          AuthMiddleware.authenticateUser,
          ValidateMiddleware.validateBody(transactionSchema.expense),
        ],
        handler: ExpenseController.updateExpense,
      },
      {
        method: "delete",
        path: "/:expenseId",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: ExpenseController.deleteExpense,
      },
    ];
  }
}

export default new ExpenseRouter().router;