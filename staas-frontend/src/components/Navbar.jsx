import { useNavigate, Link } from "react-router-dom";

export default function Navbar({ role = "client" }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const clientLinks = [
    { to: "/client/dashboard", label: "Dashboard" },
    { to: "/client/espaces", label: "Mes Espaces" },
    { to: "/client/provision", label: "Nouveau Stockage" },
    { to: "/client/factures", label: "Mes Factures" },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/clients", label: "Clients" },
    { to: "/admin/extensions", label: "Extensions" },
    { to: "/admin/factures", label: "Factures" },
    { to: "/admin/espaces", label: "Stockage" },
  ];

  const links = role === "admin" ? adminLinks : clientLinks;

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>STaaS {role === "admin" ? "Admin" : "Client"}</span>
      <div style={styles.links}>
        {links.map((l) => (
          <Link key={l.to} to={l.to} style={styles.link}>{l.label}</Link>
        ))}
        <button onClick={logout} style={styles.logout}>Déconnexion</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: { background: "#2C3E50", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand: { color: "#fff", fontWeight: "bold", fontSize: "1.2rem" },
  links: { display: "flex", gap: "1.5rem", alignItems: "center" },
  link: { color: "#ecf0f1", textDecoration: "none", fontSize: "0.95rem" },
  logout: { background: "#e74c3c", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" },
};
