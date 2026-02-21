import ChatController from "@controllers/chat.controller.js";
import BaseRouter, {type RouteConfig} from "./router.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";

class ChatRouter extends BaseRouter {
  protected routes(): RouteConfig[] {
    return [
      {
        method: "post",
        path: "/",
        middlewares: [AuthMiddleware.authenticateUser],
        handler: ChatController.askQuestion,
      },
    ];
  }
}

export default new ChatRouter().router;