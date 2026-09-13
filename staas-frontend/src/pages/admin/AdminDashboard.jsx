import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/axios";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/dashboard/admin").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div>
      <Navbar role="admin" />
      <div style={styles.container}>
        <h2 style={styles.title}>Dashboard Administrateur</h2>
        <div style={styles.totalCard}>
          <span>Revenu mensuel total</span>
          <span style={styles.totalAmount}>{data.total_global_mois} DT</span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Client</th>
              <th style={styles.th}>Entreprise</th>
              <th style={styles.th}>Nb Espaces</th>
              <th style={styles.th}>Quota Total</th>
              <th style={styles.th}>Coût Mensuel</th>
            </tr>
          </thead>
          <tbody>
            {data.clients.map((c) => (
              <tr key={c.client_id} style={styles.tr}>
                <td style={styles.td}>{c.client_nom}</td>
                <td style={styles.td}>{c.nom_entreprise || "—"}</td>
                <td style={styles.td}>{c.nb_espaces}</td>
                <td style={styles.td}>{c.quota_total_gb} GB</td>
                <td style={styles.td}><b>{c.cout_mensuel} DT</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  loading: { textAlign: "center", marginTop: "5rem" },
  container: { padding: "2rem", maxWidth: "1100px", margin: "0 auto" },
  title: { color: "#2C3E50", marginBottom: "1.5rem" },
  totalCard: { background: "#2C3E50", color: "#fff", padding: "1.5rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  totalAmount: { fontSize: "2rem", fontWeight: "bold", color: "#f39c12" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
  thead: { background: "#2C3E50" },
  th: { padding: "1rem", color: "#fff", textAlign: "left" },
  tr: { borderBottom: "1px solid #ecf0f1" },
  td: { padding: "1rem", color: "#2C3E50" },
};
