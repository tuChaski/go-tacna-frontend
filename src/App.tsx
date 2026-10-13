import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Páginas placeholder que crearemos a continuación
const HomePage = () => <div className="p-8 text-2xl font-bold">Mapa / Consulta Pública de Rutas (Tacna)</div>;
const LoginPage = () => <div className="p-8 text-2xl font-bold">Pantalla de Login</div>;
const AdminDashboard = () => <div className="p-8 text-2xl font-bold">Panel de Administración de Flotas</div>;

const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: string[] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.rol)) return <Navigate to="/" replace />;

  return children;
};

export function AppRoutes() {
  return (
    <Routes>
      {/* Vista pública para pasajeros */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas de administración */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
