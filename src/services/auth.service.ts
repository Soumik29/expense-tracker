import api from "./api";
import type { User } from "../context/AuthContext";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthResponse {
  id: number;
  username: string;
  email: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", {
      email: credentials.email.trim(),
      password: credentials.password,
    });
    return response.data!;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", {
      username: credentials.username.trim(),
      email: credentials.email.trim(),
      password: credentials.password,
      confirmPassword: credentials.confirmPassword,
    });
    return response.data!;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout", {});
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get<User>("/user/info");
      return response.data || null;
    } catch {
      return null;
    }
  },

  async refreshToken(): Promise<boolean> {
    try {
      await api.post("/auth/refresh-token", {});
      return true;
    } catch {
      return false;
    }
  },
};

export default authService;
