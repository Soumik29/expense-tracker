import { createContext } from "react";
export interface User{
  id: number;
  username: string;
  name: string;
  createAt: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);