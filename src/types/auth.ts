export type Role = 'pasajero' | 'conductor' | 'admin_general' | 'admin_empresa';

export interface EmpresaSesion { id: number; razonSocial: string }

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Role;
  empresas: EmpresaSesion[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  contrasena: string;
}
