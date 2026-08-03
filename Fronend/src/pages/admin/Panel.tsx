import { useEffect, useState } from "react";
import { obtenerPanelAdmin, type PanelAdmin } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const COLORES = [
  { clase: "violet", hex: "#6366f1" },
  { clase: "orange", hex: "#f59e0b" },
  { clase: "blue", hex: "#0ea5e9" },
  { clase: "red", hex: "#ef4444" },
  { clase: "green", hex: "#22c55e" },
];

export default function Panel() {
  const { token } = useAuth();
  const [datos, setDatos] = useState<PanelAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerPanelAdmin(token)
      .then(setDatos)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el panel."));
  }, [token]);

  if (error) return <main className="wide"><p role="alert">{error}</p></main>;
  if (!datos) return <main className="wide"><p>Cargando...</p></main>;

  const tarjetas = [
    ...datos.usuariosPorRol.map((u) => ({ label: `Usuarios (${u.rol})`, valor: u.total })),
    { label: "Gimnasios", valor: datos.totalGimnasios },
    { label: "Productos", valor: datos.totalProductos },
    { label: "Pedidos pendientes", valor: datos.pedidosPendientes },
    { label: "Facturas pendientes", valor: datos.facturasPendientes },
  ];

  return (
    <main className="wide">
      <div className="page-h">
        <div>
          <span className="eyebrow">Sistema</span>
          <h1>Panel de Administración</h1>
        </div>
      </div>
      <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginTop: 16 }}>
        {tarjetas.map((tarjeta, i) => {
          const color = COLORES[i % COLORES.length];
          return (
            <div key={tarjeta.label} className={`card stat-card ${color.clase}`}>
              <div className="n" style={{ color: color.hex }}>{tarjeta.valor}</div>
              <div className="k">{tarjeta.label}</div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
