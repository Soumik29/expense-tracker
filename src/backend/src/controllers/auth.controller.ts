import Send from "@utils/response.utils.js";
import { prisma } from "../db.js";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import authSchema from "../validations/auth.schema.js";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt, { type SignOptions } from "jsonwebtoken";
import authConfig from "@config/auth.config.js";

const { sign } = jwt;

// Helper to get secrets at runtime (after dotenv loads)
const getSecrets = () => ({
  access: authConfig.secret as string,
  refresh: authConfig.refreshToken as string,
});

class AuthController {
  // Shared by login and register — both end with "issue a valid session for
  // this user." Previously only login did this, so a freshly-registered user
  // was shown the dashboard as if authenticated while their session cookies
  // were never actually set, and every subsequent API call 401'd until they
  // explicitly logged in.
  private static issueSession = async (
    res: Response,
    user: { id: number; email: string; username: string },
  ) => {
    const { access: sec, refresh: refreshSec } = getSecrets();

    const accessToken = sign({ userId: user.id }, sec, {
      expiresIn: authConfig.secret_expries_in,
    } as SignOptions);

    const refreshToken = sign({ userId: user.id }, refreshSec, {
      expiresIn: authConfig.refreshToken_expries_in,
    } as SignOptions);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { email: user.email },
      data: { refreshToken: hashedRefreshToken },
    });
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
    };
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);
  };

  static login = async (req: Request, res: Response) => {
    const { email, password } = req.body as z.infer<typeof authSchema.login>;
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        return Send.unauthorized(res, null, "Invalid Credentials");
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return Send.unauthorized(res, null, "Incorrect Password");
      }

      await AuthController.issueSession(res, user);

      return Send.success(res, {
        id: user.id,
        username: user.username,
        email: user.email,
      });
    } catch (error) {
      console.error("Login Failed:", error);
      return Send.error(res, null, "Login Failed.");
    }
  };

  static register = async (req: Request, res: Response) => {
    const { username, email, password } = req.body as z.infer<
      typeof authSchema.register
    >;
    // Password confirmation is validated by Zod schema
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return Send.error(res, null, "Email is already in use.");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
      });

      await AuthController.issueSession(res, newUser);

      return Send.success(
        res,
        {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
        "User successfully registered.",
      );
    } catch (error) {
      console.error("Registration failed:", error);
      return Send.error(res, null, "Registration Failed!");
    }
  };

  static logout = async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { refreshToken: null },
        });
      }
      const isProduction = process.env.NODE_ENV === "production";
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? ("none" as const) : ("lax" as const),
      };
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);
      return Send.success(res, null, "Logged out Successfully!");
    } catch (error) {
      console.error("Logout Failed:", error);
      return Send.error(res, null, "Logout Failed!");
    }
  };

  static refreshToken = async (req: Request, res: Response) => {
    try {
      const { access: sec } = getSecrets();
      const userId = (req as AuthenticatedRequest).userId;
      const refreshToken = req.cookies.refreshToken;

      if (!userId) {
        return Send.unauthorized(res, null, "User ID not found");
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.refreshToken) {
        return Send.unauthorized(res, null, "Refresh token not found");
      }
      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isValid) {
        return Send.unauthorized(res, null, "Invalid refresh token");
      }

      const newAccessToken = sign({ userId: user.id }, sec, {
        expiresIn: authConfig.secret_expries_in,
      } as SignOptions);

      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        maxAge: 15 * 60 * 1000, //15 minutes
        sameSite: isProduction ? ("none" as const) : ("lax" as const),
      });

      return Send.success(res, {
        message: "Access token refreshed successfully",
      });
    } catch (error) {
      console.error("Refresh Token failed:", error);
      return Send.error(res, null, "Failed to refresh token");
    }
  };
}

export default AuthController;
