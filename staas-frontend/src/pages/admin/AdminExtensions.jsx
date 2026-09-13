import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/axios";

export default function AdminExtensions() {
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchExtensions = () => {
    API.get("/admin/extensions/en-attente").then((res) => {
      setExtensions(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchExtensions(); }, []);

  const approuver = async (id) => {
    await API.put(`/admin/extensions/${id}/approuver`);
    setMessage("Extension approuvée !");
    fetchExtensions();
  };

  const refuser = async (id) => {
    await API.put(`/admin/extensions/${id}/refuser`);
    setMessage("Extension refusée.");
    fetchExtensions();
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div>
      <Navbar role="admin" />
      <div style={styles.container}>
        <h2 style={styles.title}>Demandes d'Extension en attente</h2>
        {message && <div style={styles.success}>{message}</div>}
        {extensions.length === 0 ? (
          <div style={styles.empty}>✓ Aucune demande d'extension en attente.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>ID</th>
<th style={styles.th}>Client</th>
<th style={styles.th}>Espace</th>
<th style={styles.th}>Quota actuel</th>
<th style={styles.th}>Nouveau quota</th>
<th style={styles.th}>Date</th>
<th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {extensions.map((e) => (
                <tr key={e.id} style={styles.tr}>
                  <td style={styles.td}>#{e.id}</td>
                  <td style={styles.td}>{e.client_nom}</td>
                  <td style={styles.td}>{e.espace_nom}</td>
                  <td style={styles.td}>{e.quota_actuel} GB</td>
                  <td style={styles.td}><b>{e.nouveau_quota} GB</b></td>
                  <td style={styles.td}>{new Date(e.date_creation).toLocaleDateString("fr-FR")}</td>
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
  container: { padding: "2rem", maxWidth: "1100px", margin: "0 auto" },
  title: { color: "#2C3E50", marginBottom: "1.5rem" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
  thead: { background: "#2C3E50" },
  th: { padding: "1rem", color: "#fff", textAlign: "left" },
  tr: { borderBottom: "1px solid #ecf0f1" },
  td: { padding: "1rem", color: "#2C3E50" },
  btnApprouver: { background: "#27ae60", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", marginRight: "0.5rem" },
  btnRefuser: { background: "#e74c3c", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer" },
  success: { background: "#eafff0", color: "#27ae60", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" },
  empty: { background: "#eafff0", color: "#27ae60", padding: "1.5rem", borderRadius: "8px", textAlign: "center" },
};
