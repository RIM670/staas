import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import API from "../../api/axios";

const SLA_CONFIG = {
  standard: { quota_max: 50, tarif: 0.5, color: "#7f8c8d", desc: "Max 50GB — 0.5 DT/GB" },
  premium: { quota_max: 200, tarif: 0.4, color: "#3498db", desc: "Max 200GB — 0.4 DT/GB" },
  enterprise: { quota_max: 1024, tarif: 0.3, color: "#f39c12", desc: "Max 1TB — 0.3 DT/GB" },
};

export default function Provision() {
  const [form, setForm] = useState({ nom: "", type_stockage: "s3", quota_gb: 5, sla: "standard" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const quota_max = SLA_CONFIG[form.sla].quota_max;
    if (form.quota_gb > quota_max) {
      setError(`Quota dépasse la limite SLA ${form.sla} (max ${quota_max}GB)`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await API.post("/storage/provision", { ...form, quota_gb: parseInt(form.quota_gb) });
      setSuccess("Demande envoyée ! En attente de validation par un administrateur. Vous recevrez un email une fois approuvée.");
      setTimeout(() => navigate("/client/espaces"), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors du provisioning");
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { value: "s3", label: "Object Storage (S3)", desc: "Stockage de fichiers via protocole S3", color: "#3498db" },
    { value: "nfs", label: "File Storage (NFS)", desc: "Dossier réseau partagé via NFS", color: "#9b59b6" },
    { value: "rbd", label: "Block Storage (RBD)", desc: "Disque virtuel brut pour VMs", color: "#e67e22" },
    { value: "smb", label: "File Storage (SMB)", desc: "Dossier réseau Windows via SMB", color: "#27ae60" },
  ];

  const slaOptions = [
    { value: "standard", label: "Standard", ...SLA_CONFIG.standard },
    { value: "premium", label: "Premium", ...SLA_CONFIG.premium },
    { value: "enterprise", label: "Enterprise", ...SLA_CONFIG.enterprise },
  ];

  const tarif_actuel = SLA_CONFIG[form.sla]?.tarif || 0.5;
  const quota_max_actuel = SLA_CONFIG[form.sla]?.quota_max || 50;
  const cout_estime = (form.quota_gb * tarif_actuel).toFixed(2);
  const quota_depasse = form.quota_gb > quota_max_actuel;

  return (
    <div>
      <Navbar role="client" />
      <div style={styles.container}>
        <h2 style={styles.title}>Provisionner un Espace de Stockage</h2>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
        <div style={styles.card}>
          <form onSubmit={handleSubmit}>

            <label style={styles.label}>Nom de l'espace</label>
            <input
              style={styles.input}
              type="text"
              placeholder="ex: mes-backups"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              required
            />

            <label style={styles.label}>Type de stockage</label>
            <div style={styles.typeGrid}>
              {types.map((t) => (
                <div
                  key={t.value}
                  style={{ ...styles.typeCard, border: form.type_stockage === t.value ? `2px solid ${t.color}` : "2px solid #ddd" }}
                  onClick={() => setForm({ ...form, type_stockage: t.value })}
                >
                  <span style={{ ...styles.typeBadge, background: t.color }}>{t.label}</span>
                  <p style={styles.typeDesc}>{t.desc}</p>
                </div>
              ))}
            </div>

            <label style={styles.label}>Niveau de service (SLA)</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
              {slaOptions.map((s) => (
                <div
                  key={s.value}
                  style={{ ...styles.typeCard, border: form.sla === s.value ? `2px solid ${s.color}` : "2px solid #ddd" }}
                  onClick={() => setForm({ ...form, sla: s.value })}
                >
                  <span style={{ ...styles.typeBadge, background: s.color }}>{s.label}</span>
                  <p style={styles.typeDesc}>{s.desc}</p>
                </div>
              ))}
            </div>

            <label style={styles.label}>Quota (GB) — max {quota_max_actuel}GB pour {form.sla}</label>
            <input
              style={{ ...styles.input, borderColor: quota_depasse ? "#e74c3c" : "#ddd" }}
              type="number"
              min="1"
              max={quota_max_actuel}
              value={form.quota_gb}
              onChange={(e) => setForm({ ...form, quota_gb: e.target.value })}
              required
            />

            <div style={{ ...styles.preview, borderLeft: `4px solid ${SLA_CONFIG[form.sla]?.color}` }}>
              <div>Niveau SLA : <b>{form.sla.toUpperCase()}</b></div>
              <div>Tarif : <b>{tarif_actuel} DT/GB/mois</b></div>
              <div>Coût estimé : <b>{cout_estime} DT/mois</b></div>
              {quota_depasse && (
                <div style={{ color: "#e74c3c", marginTop: "0.5rem" }}>
                  ⚠ Quota dépasse la limite SLA ({quota_max_actuel}GB max)
                </div>
              )}
            </div>

            <button style={styles.button} type="submit" disabled={loading || quota_depasse}>
              {loading ? "Envoi en cours..." : "Envoyer la demande"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "2rem", maxWidth: "700px", margin: "0 auto" },
  title: { color: "#2C3E50", marginBottom: "1.5rem" },
  card: { background: "#fff", borderRadius: "12px", padding: "2rem", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
  label: { display: "block", marginBottom: "0.5rem", color: "#2C3E50", fontWeight: "bold" },
  input: { width: "100%", padding: "0.75rem", marginBottom: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", fontSize: "1rem", boxSizing: "border-box" },
  typeGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "1.5rem" },
  typeCard: { padding: "1rem", borderRadius: "8px", cursor: "pointer", textAlign: "center" },
  typeBadge: { color: "#fff", padding: "0.25rem 0.5rem", borderRadius: "6px", fontSize: "0.8rem", display: "inline-block" },
  typeDesc: { fontSize: "0.8rem", color: "#7f8c8d", marginTop: "0.5rem" },
  preview: { background: "#f8f9fa", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", color: "#2C3E50", lineHeight: "1.8" },
  button: { width: "100%", padding: "0.75rem", background: "#27ae60", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1rem", cursor: "pointer" },
  error: { background: "#ffeaea", color: "#e74c3c", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" },
  success: { background: "#eafff0", color: "#27ae60", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" },
};