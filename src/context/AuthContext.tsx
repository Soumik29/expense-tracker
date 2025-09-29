import { createContext } from "react";
export interface User{
  id: number;
  username: string;
  name: string;
  createAt: string;
}

interface AuthContextType {
  user: User | null; // You can replace `any` with a proper User type once you define it
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);