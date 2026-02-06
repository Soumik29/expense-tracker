import Send from "@utils/response.utils.js";
import { prisma } from "../db.js";
import type { Request, Response } from "express";
import authSchema from "../validations/auth.schema.js";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt, { type SignOptions } from "jsonwebtoken";
import authConfig from "@config/auth.config.js";

const sec = authConfig.secret as string;
const { sign } = jwt;
class AuthController {
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

      const accessToken = sign({ userId: user.id }, sec, {
        expiresIn: authConfig.secret_expries_in,
      } as SignOptions);

      const refreshTokenSecret = authConfig.refreshToken as string;
      const refreshToken = sign({ userId: user.id }, refreshTokenSecret, {
        expiresIn: authConfig.refreshToken_expries_in,
      } as SignOptions);
      await prisma.user.update({
        where: { email },
        data: { refreshToken },
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
      });

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
      // console.log(existingUser);
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
      const userId = (req as Request & { userId?: number }).userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { refreshToken: null },
        });
      }
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return Send.success(res, null, "Logged out Successfully!");
    } catch (error) {
      console.error("Logout Failed:", error);
      return Send.error(res, null, "Logout Failed!");
    }
  };

  static refreshToken = async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { userId?: number }).userId;
      const refreshToken = req.cookies.refreshToken;

      const user = await prisma.user.findUnique({
        where: { id: userId! },
      });

      if (!user || !user.refreshToken) {
        return Send.unauthorized(res, "Refresh token not found");
      }

      if (user.refreshToken !== refreshToken) {
        return Send.unauthorized(res, { message: "Invalid refresh token" });
      }

      const newAccessToken = sign({ userId: user.id }, sec, {
        expiresIn: authConfig.secret_expries_in,
      } as SignOptions);

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000, //15 minutes
        sameSite: "lax",
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
