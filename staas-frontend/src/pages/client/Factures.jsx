import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/axios";

const PACKS = [
  { value: "pack_1_mois", label: "1 Mois", remise: "0%" },
  { value: "pack_3_mois", label: "3 Mois", remise: "-10%" },
  { value: "pack_6_mois", label: "6 Mois", remise: "-15%" },
  { value: "pack_annuel", label: "Annuel", remise: "-20%" },
  { value: "pay_as_you_go", label: "Pay-as-you-Go", remise: "0%" },
];

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState("pack_1_mois");
  const [message, setMessage] = useState("");

  const fetchFactures = () => {
    API.get("/factures/mes-factures").then((res) => {
      setFactures(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchFactures(); }, []);

  const genererFacture = async () => {
    try {
      await API.post("/factures/generer", { type_facturation: selectedPack });
      setMessage("Facture générée avec succès !");
      setShowModal(false);
      fetchFactures();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Erreur");
    }
  };

  const telechargerPDF = (id) => {
    window.open(`http://127.0.0.1:8000/factures/${id}/pdf`, "_blank");
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div>
      <Navbar role="client" />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Mes Factures</h2>
          <button style={styles.btnNew} onClick={() => setShowModal(true)}>+ Générer une facture</button>
        </div>
        {message && <div style={styles.success}>{message}</div>}
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>N°</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Montant HT</th>
              <th style={styles.th}>Remise</th>
              <th style={styles.th}>Total TTC</th>
              <th style={styles.th}>Période</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}>PDF</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((f) => (
              <tr key={f.id} style={styles.tr}>
                <td style={styles.td}>#{f.id}</td>
                <td style={styles.td}>{f.type_facturation}</td>
                <td style={styles.td}>{f.montant_ht} DT</td>
                <td style={styles.td}>-{f.remise_pct}%</td>
                <td style={styles.td}><b>{f.montant_ttc} DT</b></td>
                <td style={styles.td}>{new Date(f.periode_debut).toLocaleDateString("fr-FR")} → {new Date(f.periode_fin).toLocaleDateString("fr-FR")}</td>
                <td style={styles.td}>
                  <span style={{ color: f.statut === "payee" ? "#27ae60" : "#e74c3c", fontWeight: "bold" }}>
                    {f.statut === "payee" ? "✓ Payée" : "✗ Non payée"}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={styles.btnPdf} onClick={() => telechargerPDF(f.id)}>📄 PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {factures.length === 0 && <p style={styles.empty}>Aucune facture générée.</p>}

        {showModal && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>Générer une facture</h3>
              <div style={styles.packGrid}>
                {PACKS.map((p) => (
                  <div
                    key={p.value}
                    style={{ ...styles.packCard, border: selectedPack === p.value ? "2px solid #2C3E50" : "2px solid #ddd" }}
                    onClick={() => setSelectedPack(p.value)}
                  >
                    <b>{p.label}</b>
                    <span style={styles.remise}>{p.remise}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button style={styles.btnNew} onClick={genererFacture}>Générer</button>
                <button style={styles.btnCancel} onClick={() => setShowModal(false)}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  loading: { textAlign: "center", marginTop: "5rem" },
  container: { padding: "2rem", maxWidth: "1100px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  title: { color: "#2C3E50" },
  btnNew: { background: "#27ae60", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "8px", cursor: "pointer" },
  btnCancel: { background: "#e74c3c", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "8px", cursor: "pointer" },
  btnPdf: { background: "#3498db", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
  thead: { background: "#2C3E50" },
  th: { padding: "1rem", color: "#fff", textAlign: "left", fontSize: "0.9rem" },
  tr: { borderBottom: "1px solid #ecf0f1" },
  td: { padding: "1rem", fontSize: "0.9rem", color: "#2C3E50" },
  empty: { textAlign: "center", color: "#7f8c8d", marginTop: "2rem" },
  success: { background: "#eafff0", color: "#27ae60", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", padding: "2rem", borderRadius: "12px", width: "500px" },
  packGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginTop: "1rem" },
  packCard: { padding: "1rem", borderRadius: "8px", cursor: "pointer", textAlign: "center" },
  remise: { display: "block", color: "#27ae60", fontWeight: "bold", marginTop: "0.25rem" },
};
