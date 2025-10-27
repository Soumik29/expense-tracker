import Send from "@utils/response.utils.js";
import type { NextFunction, Request, Response } from "express";
import { ZodError, ZodType} from "zod";

class ValidateMiddleware {
  static validateBody(schema: ZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        schema.parse(req.body);
        next();
      } catch (err) {
        if (err instanceof ZodError) {
          const formattedErrors: Record<string, string[]> = {};
          err.issues.forEach((error) => {
            const field = error.path.join(".");
            if(!formattedErrors[field]){
                formattedErrors[field] = []
            }
            formattedErrors[field].push(error.message)
          });
          return Send.validationErrors(res, formattedErrors);
        }
      }
      // return Send.error(res, "Invalid request data");
    };
  }
}

export default ValidateMiddleware;
