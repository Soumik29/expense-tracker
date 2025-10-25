import authConfig from "@config/auth.config.js";
import Send from "@utils/response.utils.js";
import type { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

export interface DecodedToken {
  userId: number;
}
let sec: string = authConfig.secret as string;
class AuthMiddleware {
  static authenticateUser = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const token = req.cookies.accessToken;
    if (!token) {
      return Send.unauthorized(res, null);
    }
    try {
      const decodedToken = verify(token, sec) as DecodedToken;
      
      (req as any).userId = decodedToken.userId;
      next()
    } catch (err) {
      console.error("Authentication Failed:", err);
      Send.unauthorized(res, null);
    }
  };

  static refreshTokenValidation = (req: Request, res: Response, next: NextFunction) => {
    const refreshToken =  req.cookies.refreshToken;

    if (!refreshToken){
      return Send.unauthorized(res, {message: "No refresh token provided"});
    }

    try{
      const decodedToken = verify(refreshToken, sec) as DecodedToken;
      (req as any).userId = decodedToken.userId;
      next()
    }catch(err){
      console.log("Authentication Failed", err);
      Send.unauthorized(res, {message: "Invalid or refresh token is expired"})
    }
  }
}

export default AuthMiddleware;

