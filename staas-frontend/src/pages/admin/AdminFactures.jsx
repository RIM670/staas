import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/axios";

export default function AdminFactures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const fetchFactures = () => {
    API.get("/factures/admin/toutes").then((res) => {
      setFactures(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchFactures(); }, []);

  const marquerPayee = async (id) => {
    await API.put(`/factures/admin/${id}/marquer-payee`);
    setMessage("Facture marquée comme payée !");
    fetchFactures();
  };

  const declencherFacturationMensuelle = async () => {
    setEnvoiEnCours(true);
    setMessage("");
    try {
      await API.post("/factures/admin/declencher-facturation-mensuelle");
      setMessage("Facturation mensuelle déclenchée — emails envoyés à tous les clients actifs !");
      fetchFactures();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Erreur lors de l'envoi");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const telechargerPDF = (id) => {
    window.open(`http://127.0.0.1:8000/factures/${id}/pdf`, "_blank");
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div>
      <Navbar role="admin" />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Gestion des Factures</h2>
          <button style={styles.btnEnvoi} onClick={declencherFacturationMensuelle} disabled={envoiEnCours}>
            {envoiEnCours ? "Envoi en cours..." : "📧 Déclencher facturation mensuelle"}
          </button>
        </div>
        {message && <div style={styles.success}>{message}</div>}
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>N°</th>
              <th style={styles.th}>Client</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Montant TTC</th>
              <th style={styles.th}>Période</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((f) => (
              <tr key={f.id} style={styles.tr}>
                <td style={styles.td}>#{f.id}</td>
                <td style={styles.td}>{f.client_nom}</td>
                <td style={styles.td}>{f.type_facturation}</td>
                <td style={styles.td}><b>{f.montant_ttc} DT</b></td>
                <td style={styles.td}>
                  {new Date(f.periode_debut).toLocaleDateString("fr-FR")} → {new Date(f.periode_fin).toLocaleDateString("fr-FR")}
                </td>
                <td style={styles.td}>
                  <span style={{ color: f.statut === "payee" ? "#27ae60" : "#e74c3c", fontWeight: "bold" }}>
                    {f.statut === "payee" ? "✓ Payée" : "✗ Non payée"}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={styles.btnPdf} onClick={() => telechargerPDF(f.id)}>📄 PDF</button>
                  {f.statut !== "payee" && (
                    <button style={styles.btnPayee} onClick={() => marquerPayee(f.id)}>✓ Marquer payée</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {factures.length === 0 && <p style={styles.empty}>Aucune facture.</p>}
      </div>
    </div>
  );
}

const styles = {
  loading: { textAlign: "center", marginTop: "5rem" },
  container: { padding: "2rem", maxWidth: "1200px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  title: { color: "#2C3E50" },
  btnEnvoi: { background: "#9b59b6", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "8px", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
  thead: { background: "#2C3E50" },
  th: { padding: "1rem", color: "#fff", textAlign: "left", fontSize: "0.9rem" },
  tr: { borderBottom: "1px solid #ecf0f1" },
  td: { padding: "1rem", color: "#2C3E50", fontSize: "0.9rem" },
  btnPdf: { background: "#3498db", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", marginRight: "0.5rem" },
  btnPayee: { background: "#27ae60", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer" },
  success: { background: "#eafff0", color: "#27ae60", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" },
  empty: { textAlign: "center", color: "#7f8c8d", marginTop: "2rem" },
};