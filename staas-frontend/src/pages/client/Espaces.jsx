import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/axios";

export default function Espaces() {
  const [espaces, setEspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extensionModal, setExtensionModal] = useState(null);
  const [nouveauQuota, setNouveauQuota] = useState("");
  const [message, setMessage] = useState("");
  const [credsModal, setCredsModal] = useState(false);
  const [creds, setCreds] = useState(null);

  const voirCles = async () => {
    try {
      const res = await API.get("/storage/mes-credentials-s3");
      setCreds(res.data);
      setCredsModal(true);
    } catch (err) {
      setMessage("Aucune clé S3 disponible");
    }
  };

  useEffect(() => {
    API.get("/storage/mes-espaces").then((res) => {
      setEspaces(res.data);
      setLoading(false);
    });
  }, []);

  const demanderExtension = async () => {
    try {
      await API.post(`/storage/${extensionModal.id}/demande-extension`, { nouveau_quota: parseInt(nouveauQuota) });
      setMessage("Demande d'extension envoyée avec succès !");
      setExtensionModal(null);
      setNouveauQuota("");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Erreur");
    }
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div>
      <Navbar role="client" />
      <div style={styles.container}>
        <h2 style={styles.title}>Mes Espaces de Stockage</h2>
        {message && <div style={styles.success}>{message}</div>}
        <div style={styles.grid}>
          {espaces.map((e) => (
            <div key={e.id} style={styles.card}>
              <div style={styles.cardTop}>
                <span style={{
                  ...styles.badge,
                  background: e.type_stockage === "s3" ? "#3498db" :
                              e.type_stockage === "nfs" ? "#9b59b6" :
                              e.type_stockage === "smb" ? "#27ae60" : "#e67e22"
                }}>
                  {e.type_stockage.toUpperCase()}
                </span>
                <span style={{
                  ...styles.statut,
                  color: e.statut === "actif" ? "#27ae60" :
                         e.statut === "en_attente" ? "#f39c12" :
                         e.statut === "refuse" ? "#e74c3c" : "#7f8c8d"
                }}>
                  ● {e.statut === "en_attente" ? "En attente de validation" :
                     e.statut === "actif" ? "Actif" :
                     e.statut === "refuse" ? "Refusé" : e.statut}
                </span>
              </div>
              <h3 style={styles.nom}>{e.nom}</h3>
              <p style={styles.detail}>Quota : <b>{e.quota_gb} GB</b></p>
              <p style={styles.detail}>
                SLA : <span style={{
                  fontWeight: "bold",
                  color: e.sla === "enterprise" ? "#f39c12" : e.sla === "premium" ? "#3498db" : "#7f8c8d"
                }}>
                  {e.sla ? e.sla.toUpperCase() : "STANDARD"}
                </span>
              </p>
              <p style={styles.detail}>Détails : <code>{e.details}</code></p>
              <p style={styles.detail}>Créé le : {new Date(e.date_creation).toLocaleDateString("fr-FR")}</p>

              {e.statut === "actif" && (
                <button style={styles.btn} onClick={() => setExtensionModal(e)}>
                  Demander une extension
                </button>
              )}

              {/* ← NOUVEAU : bouton clés S3 */}
              {e.statut === "actif" && e.type_stockage === "s3" && (
                <button style={styles.btnCles} onClick={voirCles}>
                  🔑 Voir mes clés S3
                </button>
              )}

              {e.statut === "en_attente" && (
                <div style={styles.infoBox}>
                  ⏳ Votre demande est en cours de validation par l'administrateur.
                </div>
              )}
              {e.statut === "refuse" && (
                <div style={styles.errorBox}>
                  ✗ Demande refusée. Contactez l'administrateur.
                </div>
              )}
            </div>
          ))}
        </div>
        {espaces.length === 0 && (
          <p style={styles.empty}>Aucun espace. <a href="/client/provision">Provisionner maintenant</a></p>
        )}

        {/* Modal extension */}
        {extensionModal && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>Extension — {extensionModal.nom}</h3>
              <p>Quota actuel : <b>{extensionModal.quota_gb} GB</b></p>
              <input
                style={styles.input}
                type="number"
                placeholder="Nouveau quota (GB)"
                value={nouveauQuota}
                onChange={(e) => setNouveauQuota(e.target.value)}
                min={extensionModal.quota_gb + 1}
              />
              <div style={{ display: "flex", gap: "1rem" }}>
                <button style={styles.btn} onClick={demanderExtension}>Envoyer la demande</button>
                <button style={styles.btnCancel} onClick={() => setExtensionModal(null)}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* ← NOUVEAU : Modal clés S3 */}
        {credsModal && creds && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>🔑 Mes clés S3 personnelles</h3>
              <p style={{ fontSize: "0.85rem", color: "#e74c3c", marginBottom: "1rem" }}>
                ⚠ Gardez ces clés confidentielles — ne les partagez jamais.
              </p>
              <div style={styles.credsBox}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <b>Endpoint :</b><br />
                  <code>{creds.endpoint}</code>
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <b>Access Key :</b><br />
                  <code>{creds.access_key}</code>
                  <button style={styles.btnCopy} onClick={() => navigator.clipboard.writeText(creds.access_key)}>📋 Copier</button>
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <b>Secret Key :</b><br />
                  <code>{creds.secret_key}</code>
                  <button style={styles.btnCopy} onClick={() => navigator.clipboard.writeText(creds.secret_key)}>📋 Copier</button>
                </div>
              </div>
              <button style={styles.btnCancel} onClick={() => setCredsModal(false)}>Fermer</button>
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
  title: { color: "#2C3E50", marginBottom: "1.5rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" },
  card: { background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" },
  badge: { color: "#fff", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem" },
  statut: { fontSize: "0.85rem", fontWeight: "bold" },
  nom: { color: "#2C3E50", margin: "0.5rem 0" },
  detail: { color: "#7f8c8d", fontSize: "0.9rem", margin: "0.25rem 0" },
  btn: { marginTop: "1rem", width: "100%", padding: "0.6rem", background: "#2C3E50", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  btnCancel: { marginTop: "1rem", width: "100%", padding: "0.6rem", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  btnCles: { marginTop: "0.5rem", width: "100%", padding: "0.6rem", background: "#f39c12", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  btnCopy: { marginLeft: "0.5rem", background: "#ecf0f1", border: "none", borderRadius: "4px", cursor: "pointer", padding: "0.2rem 0.5rem", fontSize: "0.8rem" },
  credsBox: { background: "#f8f9fa", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem" },
  empty: { textAlign: "center", color: "#7f8c8d", marginTop: "2rem" },
  success: { background: "#eafff0", color: "#27ae60", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" },
  infoBox: { marginTop: "1rem", background: "#fef9e7", color: "#f39c12", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem" },
  errorBox: { marginTop: "1rem", background: "#ffeaea", color: "#e74c3c", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", padding: "2rem", borderRadius: "12px", width: "420px" },
  input: { width: "100%", padding: "0.75rem", marginBottom: "1rem", border: "1px solid #ddd", borderRadius: "8px", boxSizing: "border-box" },
};