import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({ email: "", mot_de_passe: "", nom: "", nom_entreprise: "", numero_whatsapp: "" });  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await API.post("/clients/register", form);
      setSuccess("Compte créé ! En attente de validation par un administrateur.");
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>STaaS Platform</h1>
        <h2 style={styles.subtitle}>Créer un compte</h2>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
        <form onSubmit={handleSubmit}>
          <input
  style={styles.input}
  type="text"
  placeholder="Nom complet *"
  value={form.nom}
  onChange={(e) => setForm({ ...form, nom: e.target.value })}
  required
/>
          <input style={styles.input} type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="Mot de passe *" value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })} required />
          <input style={styles.input} type="text" placeholder="Nom de l'entreprise" value={form.nom_entreprise} onChange={(e) => setForm({ ...form, nom_entreprise: e.target.value })} />
          <input style={styles.input} type="text" placeholder="Numéro WhatsApp (ex: 21655928807)" value={form.numero_whatsapp} onChange={(e) => setForm({ ...form, numero_whatsapp: e.target.value })} />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>
        <p style={styles.link}>Déjà un compte ? <Link to="/">Se connecter</Link></p>
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
  success: { background: "#eafff0", color: "#27ae60", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" },
  link: { textAlign: "center", marginTop: "1rem", color: "#7f8c8d" },
};
