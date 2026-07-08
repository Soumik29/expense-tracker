import Send from "@utils/response.utils.js";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

// A minimal structural type instead of zod's `ZodType` — importing LangChain's
// agent module elsewhere in the app does global declaration-merging on zod's
// internal types (for its dual v3/v4 interop), which can make the bare
// `ZodType` default generic incompatible with plain, unbranded zod schemas.
// This middleware only ever needs `.parse()`, so depending on that narrower
// shape sidesteps the conflict entirely.
type ParsableSchema = { parse: (data: unknown) => unknown };

class ValidateMiddleware {
  static validateBody(schema: ParsableSchema) {
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
        return Send.error(res, null, "Invalid request data");
      }
    };
  }
}

export default ValidateMiddleware;
