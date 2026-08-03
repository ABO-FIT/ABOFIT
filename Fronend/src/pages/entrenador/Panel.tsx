import { useEffect, useState } from "react";
import { obtenerPanelEntrenador, type PanelEntrenador } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function Panel() {
  const { token } = useAuth();
  const [datos, setDatos] = useState<PanelEntrenador | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerPanelEntrenador(token)
      .then(setDatos)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el panel."));
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
    { label: "Clientes en Plan B", valor: datos.clientesPlanB },
    { label: "Mensajes sin leer", valor: datos.mensajesSinLeer },
    { label: "Cumplimiento promedio semanal", valor: `${datos.cumplimientoPromedio}%` },
  ];

  return (
    <main className="wide">
      <h1>Panel</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {tarjetas.map((tarjeta) => (
          <div key={tarjeta.label} className="card">
            <p style={{ color: "var(--muted)", margin: 0, fontSize: 14 }}>{tarjeta.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{tarjeta.valor}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
