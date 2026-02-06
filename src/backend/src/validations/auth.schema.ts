import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[@$!%*?&]/, "Password must include at least one special character");

const userSchema = z
  .string()
  .min(6, "Username must be at least 6 characters long")
  .max(20, "Username must not exceed 20 characters");

const login = z.object({
    email: z.string().trim().email("Invalid email format").min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
});

const register = z.object({
    username: userSchema,
    email: z.string().trim().email("Invalid email format"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Password is required")
}).refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
});

const authSchema = {
    login,
    register
};

export default authSchema;

