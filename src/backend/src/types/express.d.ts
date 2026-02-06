import type { Request } from "express";

// Extend Express Request type to include userId from authentication middleware
export interface AuthenticatedRequest extends Request {
  userId: number;
}
