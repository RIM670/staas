import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/axios";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/dashboard/me").then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div>
      <Navbar role="client" />
      <div style={styles.container}>
        <h2 style={styles.title}>Mon Dashboard de Consommation</h2>
        <div style={styles.totalCard}>
          <span>Coût mensuel total estimé</span>
          <span style={styles.totalAmount}>{data.total_cout_mois} DT</span>
        </div>
        <div style={styles.grid}>
          {data.espaces.map((e) => (
            <div key={e.espace_id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.type}>{e.type.toUpperCase()}</span>
                <span style={styles.nom}>{e.nom}</span>
              </div>
              <div style={styles.barContainer}>
                <div style={{ ...styles.bar, width: `${Math.min(e.pourcentage, 100)}%`, background: e.pourcentage > 80 ? "#e74c3c" : "#27ae60" }} />
              </div>
              <div style={styles.stats}>
                <span>{e.utilise_gb} GB utilisés / {e.quota_gb} GB</span>
                <span>{e.pourcentage}%</span>
              </div>
              <div style={styles.cout}>{e.cout_mois} DT/mois</div>
            </div>
          ))}
        </div>
        {data.espaces.length === 0 && (
          <p style={styles.empty}>Aucun espace de stockage. <a href="/client/provision">Provisionner un espace</a></p>
        )}
      </div>
    </div>
  );
}

const styles = {
  loading: { textAlign: "center", marginTop: "5rem", fontSize: "1.2rem" },
  container: { padding: "2rem", maxWidth: "1100px", margin: "0 auto" },
  title: { color: "#2C3E50", marginBottom: "1.5rem" },
  totalCard: { background: "#2C3E50", color: "#fff", padding: "1.5rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  totalAmount: { fontSize: "2rem", fontWeight: "bold", color: "#f39c12" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" },
  card: { background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "1rem" },
  type: { background: "#2C3E50", color: "#fff", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem" },
  nom: { color: "#7f8c8d", fontWeight: "bold" },
  barContainer: { background: "#ecf0f1", borderRadius: "10px", height: "10px", marginBottom: "0.5rem" },
  bar: { height: "10px", borderRadius: "10px", transition: "width 0.3s" },
  stats: { display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#7f8c8d" },
  cout: { marginTop: "0.75rem", fontWeight: "bold", color: "#2C3E50", fontSize: "1.1rem" },
  empty: { textAlign: "center", color: "#7f8c8d", marginTop: "2rem" },
};
