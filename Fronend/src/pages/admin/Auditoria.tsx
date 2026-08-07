import { useEffect, useState } from "react";
import { obtenerAuditoria, type RegistroAuditoria } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function Auditoria() {
  const { token } = useAuth();
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerAuditoria(token)
      .then(({ registros }) => setRegistros(registros))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la auditoría."));
  }, [token]);

  if (error) return <main className="wide"><p role="alert">{error}</p></main>;

  return (
    <main className="wide">
      <h1>Auditoría</h1>

      <div style={{ display: "grid", gap: 8 }}>
        {registros.map((r) => (
          <div key={r.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <strong>{r.admin_nombre}</strong>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>{new Date(r.created_at).toLocaleString("es-DO")}</span>
            </div>
            <p style={{ margin: "4px 0" }}>
              <span className="tag" style={{ background: "var(--line)" }}>{r.accion}</span>{" "}
              {r.target_type} {r.target_nombre ? `"${r.target_nombre}"` : `#${r.target_id}`}
            </p>
          </div>
        ))}
        {registros.length === 0 && <p style={{ color: "var(--muted)" }}>Sin registros todavía.</p>}
      </div>
    </main>
  );
}
