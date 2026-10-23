import { createContext } from 'react';
import type { User, LoginCredentials } from '../types/auth';
import type { DatosRegistro } from '../services/adaptador-autenticacion';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (datos: DatosRegistro) => Promise<User>;
  logout: () => Promise<boolean>;
  sessionError: string | null;
  retrySession: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
