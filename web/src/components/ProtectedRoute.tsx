import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Busca o estado de autenticação direto do contexto — sem depender de props
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Aguarda o Firebase resolver o estado antes de redirecionar
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
