import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor para inyectar el Bearer Token en cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores globales (ej: token vencido / 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No invalida por credenciales erróneas ni por respuestas tardías de otro token.
    const esAcceso = /\/auth\/(login|register)$/.test(error.config?.url ?? '');
    const tokenActual = localStorage.getItem('token');
    if (error.response?.status === 401 && !esAcceso && tokenActual
      && error.config?.headers?.Authorization === `Bearer ${tokenActual}`) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('sesion-invalidada'));
    }
    return Promise.reject(error);
  }
);

export default api;
