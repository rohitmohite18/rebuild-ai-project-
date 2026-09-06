import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import FamilyDashboard from "./pages/FamilyDashboard.jsx";
import HelpRequest from "./pages/HelpRequest.jsx";
import RecoveryStatus from "./pages/RecoveryStatus.jsx";
import VolunteerDashboard from "./pages/VolunteerDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { homePath } from "./services/api.js";
import Loading from "./components/Loading.jsx";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homePath(user.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/family"
          element={
            <ProtectedRoute roles={["family"]}>
              <FamilyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family/help"
          element={
            <ProtectedRoute roles={["family"]}>
              <HelpRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family/status"
          element={
            <ProtectedRoute roles={["family"]}>
              <RecoveryStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer"
          element={
            <ProtectedRoute roles={["volunteer"]}>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
