export type Role = 'pasajero' | 'conductor' | 'admin';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  contrasena: string;
}