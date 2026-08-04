import { useEffect, useState } from "react";
import { obtenerReportesEntrenador, type ReportesEntrenador } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function Reportes() {
  const { token } = useAuth();
  const [datos, setDatos] = useState<ReportesEntrenador | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerReportesEntrenador(token)
      .then(setDatos)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los reportes."));
  }, [token]);

  if (error) {
    return (
      <main className="wide">
        <p role="alert">{error}</p>
      </main>
    );
  }

  if (!datos) {
    return (
      <main className="wide">
        <p>Cargando...</p>
      </main>
    );
  }

  const tarjetas = [
    { label: "Total de clientes", valor: datos.totalClientes },
    { label: "Activos (14 días)", valor: datos.clientesActivos },
    { label: "Cambio promedio de peso", valor: datos.cambioPromedioPeso !== null ? `${datos.cambioPromedioPeso} kg` : "—" },
  ];

  return (
    <main className="wide">
      <span className="eyebrow">Sistema</span>
      <h1>Reportes</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
        {tarjetas.map((tarjeta) => (
          <div key={tarjeta.label} className="card stat-card">
            <div className="n">{tarjeta.valor}</div>
            <div className="k">{tarjeta.label}</div>
          </div>
        ))}
      </div>

      <h2>Distribución por objetivo</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        {datos.distribucion.map((d) => (
          <div key={d.goalKey} className="card" style={{ flex: "1 1 160px", minWidth: 160 }}>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{d.goalLabel}</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 24 }}>{d.total}</p>
          </div>
        ))}
        {datos.distribucion.length === 0 && <p style={{ color: "var(--muted)" }}>Sin clientes asignados todavía.</p>}
      </div>

      <h2>Evolución destacada</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {datos.topEvolucion.map((e) => (
          <div key={e.clienteId} className="card" style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{e.nombre}</strong>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                {e.pesoInicial} kg → {e.pesoActual} kg · {e.registros} registros
              </p>
            </div>
            <div style={{ fontWeight: 700, color: e.cambioPeso < 0 ? "var(--ok)" : "var(--accent2)" }}>
              {e.cambioPeso > 0 ? "+" : ""}
              {e.cambioPeso} kg
            </div>
          </div>
        ))}
        {datos.topEvolucion.length === 0 && (
          <p style={{ color: "var(--muted)" }}>Aún no hay suficientes registros de progreso para mostrar evolución.</p>
        )}
      </div>
    </main>
  );
}
