import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function VerifyOtp() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const email = localStorage.getItem("pending_email");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post(`/auth/verify-otp?email=${email}&code=${code}`);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("client_id", res.data.client_id);
      localStorage.removeItem("pending_email");

      // Décoder le token pour connaître le rôle
      const payload = JSON.parse(atob(res.data.access_token.split(".")[1]));
      if (payload.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/client/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Code invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>STaaS Platform</h1>
        <h2 style={styles.subtitle}>Vérification OTP</h2>
        <p style={styles.info}>Un code a été envoyé sur votre WhatsApp ({email})</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            style={{ ...styles.input, textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" }}
            type="text"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Vérification..." : "Valider"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a2e" },
  card: { background: "#fff", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" },
  title: { textAlign: "center", color: "#2C3E50", marginBottom: "0.5rem" },
  subtitle: { textAlign: "center", color: "#7f8c8d", marginBottom: "0.5rem", fontWeight: "normal" },
  info: { textAlign: "center", color: "#7f8c8d", marginBottom: "1.5rem", fontSize: "0.9rem" },
  input: { width: "100%", padding: "0.75rem", marginBottom: "1rem", border: "1px solid #ddd", borderRadius: "8px", fontSize: "1rem", boxSizing: "border-box" },
  button: { width: "100%", padding: "0.75rem", background: "#2C3E50", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1rem", cursor: "pointer" },
  error: { background: "#ffeaea", color: "#e74c3c", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" },
};
