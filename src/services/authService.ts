import api from './api';
import type { AuthResponse, LoginCredentials, User } from '../types/auth';
import { adaptarPerfil, adaptarSesion, prepararLogin, prepararRegistro } from './adaptador-autenticacion';
import type { DatosRegistro } from './adaptador-autenticacion';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // El adaptador evita propagar nombres y envoltorios de Laravel a las pantallas.
    const response = await api.post<unknown>('/auth/login', prepararLogin(credentials));
    return adaptarSesion(response.data);
  },

  async register(data: DatosRegistro): Promise<AuthResponse> {
    const response = await api.post<unknown>('/auth/register', prepararRegistro(data));
    return adaptarSesion(response.data);
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async getProfile(): Promise<User> {
    const response = await api.get<unknown>('/auth/me');
    return adaptarPerfil(response.data);
  },
};
