import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { obtenerAlertas, type AlertaCliente } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function Alertas() {
  const { token } = useAuth();
  const [alertas, setAlertas] = useState<AlertaCliente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!token) return;
    obtenerAlertas(token)
      .then(({ alertas }) => setAlertas(alertas))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar las alertas."))
      .finally(() => setCargando(false));
  }, [token]);

  return (
    <main className="wide">
      <span className="eyebrow">Seguimiento</span>
      <h1>Alertas</h1>

      {error && <p role="alert">{error}</p>}
      {cargando && <p>Cargando...</p>}

      {!cargando && alertas.length === 0 && !error && (
        <p style={{ color: "var(--muted)" }}>No hay alertas activas. Todos tus clientes están al día.</p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {alertas.map((alerta) => (
          <div key={alerta.clienteId} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong>{alerta.nombre}</strong>
                <p style={{ margin: 0, color: "var(--muted)" }}>@{alerta.usuario}</p>
              </div>
              <Link
                to={`/entrenador/clientes/${alerta.clienteId}`}
                style={{
                  font: "15px/1 var(--body)",
                  fontWeight: 700,
                  padding: "12px 18px",
                  borderRadius: 11,
                  background: "#fff",
                  color: "var(--text)",
                  border: "1.5px solid var(--line)",
                  textDecoration: "none",
                }}
              >
                Ver cliente
              </Link>
            </div>
            <ul style={{ marginTop: 10, marginBottom: 0 }}>
              {alerta.motivos.map((motivo) => (
                <li key={motivo} style={{ color: "var(--accent2)" }}>{motivo}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
