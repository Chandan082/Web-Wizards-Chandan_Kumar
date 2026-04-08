import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthed, isAdmin } = useAuth();

  if (!isAuthed) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

