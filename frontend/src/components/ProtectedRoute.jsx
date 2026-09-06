import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { homePath } from "../services/api.js";
import Loading from "./Loading.jsx";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePath(user.role)} replace />;
  return children;
}
