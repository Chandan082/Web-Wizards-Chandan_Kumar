import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import { useAuth } from "./state/AuthContext.jsx";
import { Layout } from "./ui/Layout.jsx";
import { ProtectedRoute } from "./ui/ProtectedRoute.jsx";

import { LoginPage } from "./views/LoginPage.jsx";
import { RegisterPage } from "./views/RegisterPage.jsx";
import { DashboardPage } from "./views/DashboardPage.jsx";
import { ProfilePage } from "./views/ProfilePage.jsx";
import { AdminPage } from "./views/AdminPage.jsx";

export default function App() {
  const { isAuthed } = useAuth();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={isAuthed ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
