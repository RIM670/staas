import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/axios";

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchClients = () => {
    API.get("/admin/clients/en-attente").then((res) => {
      setClients(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchClients(); }, []);

  const valider = async (id) => {
    await API.put(`/admin/clients/${id}/valider`);
    setMessage("Client validé !");
    fetchClients();
  };

  const suspendre = async (id) => {
    await API.put(`/admin/clients/${id}/suspendre`);
    setMessage("Client suspendu !");
    fetchClients();
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div>
      <Navbar role="admin" />
      <div style={styles.container}>
        <h2 style={styles.title}>Clients en attente de validation</h2>
        {message && <div style={styles.success}>{message}</div>}
        {clients.length === 0 ? (
          <div style={styles.empty}>✓ Aucun client en attente de validation.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nom</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Entreprise</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} style={styles.tr}>
                  <td style={styles.td}>#{c.id}</td>
                  <td style={styles.td}>{c.nom || "—"}</td>
                  <td style={styles.td}>{c.email}</td>
                  <td style={styles.td}>{c.nom_entreprise || "—"}</td>
                  <td style={styles.td}>{new Date(c.date_creation).toLocaleDateString("fr-FR")}</td>
                  <td style={styles.td}>
                    <button style={styles.btnValider} onClick={() => valider(c.id)}>✓ Valider</button>
                    <button style={styles.btnSuspendre} onClick={() => suspendre(c.id)}>✗ Suspendre</button>
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
  btnValider: { background: "#27ae60", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", marginRight: "0.5rem" },
  btnSuspendre: { background: "#e74c3c", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer" },
  success: { background: "#eafff0", color: "#27ae60", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" },
  empty: { background: "#eafff0", color: "#27ae60", padding: "1.5rem", borderRadius: "8px", textAlign: "center" },
};
