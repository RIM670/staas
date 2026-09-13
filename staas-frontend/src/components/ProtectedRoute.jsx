import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" />;

  if (requireAdmin) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "admin") return <Navigate to="/client/dashboard" />;
    } catch {
      return <Navigate to="/" />;
    }
  }

  return children;
}
