import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/axios";

export default function AdminEspacesValidation() {
  const [espaces, setEspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchEspaces = () => {
    API.get("/admin/storage/en-attente").then((res) => {
      setEspaces(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchEspaces(); }, []);

  const approuver = async (id) => {
    try {
      await API.put(`/admin/storage/${id}/approuver`);
      setMessage("Espace approuvé et créé sur Ceph — email envoyé au client !");
      fetchEspaces();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Erreur");
    }
  };

  const refuser = async (id) => {
    await API.put(`/admin/storage/${id}/refuser`);
    setMessage("Demande refusée — email envoyé au client.");
    fetchEspaces();
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div>
      <Navbar role="admin" />
      <div style={styles.container}>
        <h2 style={styles.title}>Demandes de stockage en attente</h2>
        {message && <div style={styles.success}>{message}</div>}
        {espaces.length === 0 ? (
          <div style={styles.empty}>✓ Aucune demande en attente.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Nom</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Quota</th>
                <th style={styles.th}>Détails Ceph</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {espaces.map((e) => (
                <tr key={e.id} style={styles.tr}>
                  <td style={styles.td}>#{e.id}</td>
                  <td style={styles.td}>{e.client_nom}</td>
                  <td style={styles.td}>{e.nom}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: e.type_stockage === "s3" ? "#3498db" :
                                  e.type_stockage === "nfs" ? "#9b59b6" : "#e67e22"
                    }}>
                      {e.type_stockage.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.td}>{e.quota_gb} GB</td>
                  <td style={styles.td}><code>{e.details}</code></td>
                  <td style={styles.td}>
                    <button style={styles.btnApprouver} onClick={() => approuver(e.id)}>✓ Approuver</button>
                    <button style={styles.btnRefuser} onClick={() => refuser(e.id)}>✗ Refuser</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  loading: { textAlign: "center", marginTop: "5rem" },
  container: { padding: "2rem", maxWidth: "1200px", margin: "0 auto" },
  title: { color: "#2C3E50", marginBottom: "1.5rem" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
  thead: { background: "#2C3E50" },
  th: { padding: "1rem", color: "#fff", textAlign: "left", fontSize: "0.9rem" },
  tr: { borderBottom: "1px solid #ecf0f1" },
  td: { padding: "1rem", color: "#2C3E50", fontSize: "0.9rem" },
  badge: { color: "#fff", padding: "0.25rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem" },
  btnApprouver: { background: "#27ae60", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", marginRight: "0.5rem" },
  btnRefuser: { background: "#e74c3c", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer" },
  success: { background: "#eafff0", color: "#27ae60", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" },
  empty: { background: "#eafff0", color: "#27ae60", padding: "1.5rem", borderRadius: "8px", textAlign: "center" },
};