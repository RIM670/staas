import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/client/Dashboard";
import Espaces from "./pages/client/Espaces";
import Provision from "./pages/client/Provision";
import Factures from "./pages/client/Factures";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClients from "./pages/admin/AdminClients";
import AdminExtensions from "./pages/admin/AdminExtensions";
import AdminFactures from "./pages/admin/AdminFactures";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminEspacesValidation from "./pages/admin/AdminEspacesValidation";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* Client */}
        <Route path="/client/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/client/espaces" element={<ProtectedRoute><Espaces /></ProtectedRoute>} />
        <Route path="/client/provision" element={<ProtectedRoute><Provision /></ProtectedRoute>} />
        <Route path="/client/factures" element={<ProtectedRoute><Factures /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/clients" element={<ProtectedRoute requireAdmin><AdminClients /></ProtectedRoute>} />
        <Route path="/admin/extensions" element={<ProtectedRoute requireAdmin><AdminExtensions /></ProtectedRoute>} />
        <Route path="/admin/factures" element={<ProtectedRoute requireAdmin><AdminFactures /></ProtectedRoute>} />
        <Route path="/admin/espaces" element={<ProtectedRoute requireAdmin><AdminEspacesValidation /></ProtectedRoute>} />

      </Routes>
    </BrowserRouter>
  );
}
