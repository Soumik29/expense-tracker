import AuthController from "@controllers/auth.controller.js";
import BaseRouter, { type RouteConfig } from "./router.js";
import ValidateMiddleware from "@middlewares/validation.middleware.js";
import authSchema from "../validations/auth.schema.js";
import AuthMiddleware from "@middlewares/auth.middleware.js";

class AuthRouter extends BaseRouter {
  protected routes(): RouteConfig[] {
    return [
      {
        method: "post",
        path: "/login",
        middlewares: [ValidateMiddleware.validateBody(authSchema.login)],
        handler: AuthController.login,
      },
      {
        method: "post",
        path: "/register",
        middlewares: [ValidateMiddleware.validateBody(authSchema.register)],
        handler: AuthController.register,
      },
      {
        method: "post",
        path: "/logout",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: AuthController.logout,
      },
      {
        method: "post",
        path: "/refresh-token",
        middlewares: [AuthMiddleware.refreshTokenValidation],
        handler: AuthController.refreshToken
      }
    ];
  }
}

export default new AuthRouter().router;
