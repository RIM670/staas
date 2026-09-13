import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

export default function Login() {
  const [form, setForm] = useState({ email: "", mot_de_passe: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/login", form);
      localStorage.setItem("pending_email", form.email);
      navigate("/verify-otp");
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>STaaS Platform</h1>
        <h2 style={styles.subtitle}>Connexion</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Mot de passe"
            value={form.mot_de_passe}
            onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
            required
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p style={styles.link}>
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a2e" },
  card: { background: "#fff", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" },
  title: { textAlign: "center", color: "#2C3E50", marginBottom: "0.5rem" },
  subtitle: { textAlign: "center", color: "#7f8c8d", marginBottom: "1.5rem", fontWeight: "normal" },
  input: { width: "100%", padding: "0.75rem", marginBottom: "1rem", border: "1px solid #ddd", borderRadius: "8px", fontSize: "1rem", boxSizing: "border-box" },
  button: { width: "100%", padding: "0.75rem", background: "#2C3E50", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1rem", cursor: "pointer" },
  error: { background: "#ffeaea", color: "#e74c3c", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" },
  link: { textAlign: "center", marginTop: "1rem", color: "#7f8c8d" },
};
