import type { Request, Response } from "express";
import Send from "@utils/response.utils.js";
import RagService from "../services/rag.service.js";
import type { AuthenticatedRequest } from "../types/express.js";

class ChatController{
    static askQuestion = async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;
            const userId = authReq.userId;

            if (!userId) return Send.unauthorized(res, null);

            const {question, history} = req.body;
            if (!question) {
                return Send.badRequest(res, {message: "Question is required"});
            }

            // Trust nothing from the client beyond shape — RagService caps
            // length again server-side regardless of what's sent here.
            const safeHistory = Array.isArray(history)
                ? history.filter(
                    (m): m is {role: "user" | "assistant"; content: string} =>
                        m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
                  )
                : [];

            const answer = await RagService.askFinancialAssistant(userId, question, safeHistory);
            return Send.success(res, {answer});
        }catch(error){
            console.error("AI Assistant Error:", error);
            return Send.error(res, null, "Failed to get an answer from the assistant");
        }
    };
}

export default ChatController;