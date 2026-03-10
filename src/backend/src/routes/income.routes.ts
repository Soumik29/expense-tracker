import IncomeController from "@controllers/income.controller.js";
import BaseRouter, { type RouteConfig } from "./router.js";
import AuthMiddleware from "@middlewares/auth.middleware.js";

class IncomeRouter extends BaseRouter {
  protected routes(): RouteConfig[] {
    return [
      {
        method: "get",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: IncomeController.getIncomes,
      },
      {
        method: "post",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: IncomeController.createIncome,
      },
      {
        method: "put",
        path: "/:incomeId",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: IncomeController.updateIncome,
      },
      {
        method: "delete",
        path: "/:incomeId",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: IncomeController.deleteIncome,
      },
    ];
  }
}

export default new IncomeRouter().router;

