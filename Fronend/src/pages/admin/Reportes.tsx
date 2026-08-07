import { useEffect, useState } from "react";
import { obtenerReporteVentas, type ReporteVentas } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

export default function Reportes() {
  const { token } = useAuth();
  const [datos, setDatos] = useState<ReporteVentas | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerReporteVentas(token)
      .then(setDatos)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el reporte."));
  }, [token]);

  if (error) return <main className="wide"><p role="alert">{error}</p></main>;
  if (!datos) return <main className="wide"><p>Cargando...</p></main>;

  return (
    <main className="wide">
      <h1>Reporte de Ventas</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div className="card">
          <p style={{ color: "var(--muted)", margin: 0, fontSize: 14 }}>Ventas históricas</p>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{money(datos.totalHistorico)}</p>
        </div>
        <div className="card">
          <p style={{ color: "var(--muted)", margin: 0, fontSize: 14 }}>Últimos 30 días</p>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{money(datos.totalUltimos30Dias)}</p>
        </div>
      </div>

      <h2>Pedidos por estado</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {datos.pedidosPorEstado.map((p) => (
          <div key={p.estado} className="card">
            <p style={{ margin: 0, color: "var(--muted)", textTransform: "capitalize" }}>{p.estado}</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 20 }}>{p.total}</p>
          </div>
        ))}
      </div>

      <h2>Productos más vendidos</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {datos.topProductos.map((p) => (
          <div key={p.name} className="card" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span>{p.name}</span>
            <strong>{p.cantidad} unidades</strong>
          </div>
        ))}
        {datos.topProductos.length === 0 && <p style={{ color: "var(--muted)" }}>Sin datos todavía.</p>}
      </div>
    </main>
  );
}
