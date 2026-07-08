import BudgetController from "@controllers/budget.controller.js";
import BaseRouter, { type RouteConfig } from "./router.js";
import AuthMiddleware from "@middlewares/auth.middleware.js";
import ValidateMiddleware from "@middlewares/validation.middleware.js";
import transactionSchema from "../validations/transaction.schema.js";

class BudgetRouter extends BaseRouter {
  protected routes(): RouteConfig[] {
    return [
      {
        method: "get",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: BudgetController.getBudgets,
      },
      {
        method: "post",
        path: "/",
        middlewares: [
          AuthMiddleware.authenticateUser,
          ValidateMiddleware.validateBody(transactionSchema.budget),
        ],
        handler: BudgetController.upsertBudget,
      },
      {
        method: "delete",
        path: "/:category",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: BudgetController.deleteBudget,
      },
    ];
  }
}

export default new BudgetRouter().router;
