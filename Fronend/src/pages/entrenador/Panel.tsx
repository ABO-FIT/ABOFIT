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
  ];

  return (
    <main className="wide">
      <span className="eyebrow">Sistema</span>
      <h1>Panel</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
        {tarjetas.map((tarjeta) => (
          <div key={tarjeta.label} className="card stat-card">
            <div className="n">{tarjeta.valor}</div>
            <div className="k">{tarjeta.label}</div>
          </div>
        ))}

        <div className="card stat-card">
          <div className="n">{datos.cumplimientoPromedio}%</div>
          <div className="k">Cumplimiento promedio</div>
          <div className="energy" style={{ marginTop: 8 }}>
            <span style={{ width: `${datos.cumplimientoPromedio}%` }} />
          </div>
        </div>
      </div>
    </main>
  );
}
