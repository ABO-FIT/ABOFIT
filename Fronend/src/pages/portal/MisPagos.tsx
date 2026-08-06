import { useEffect, useState } from "react";
import { obtenerMisPagos, type Pago } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

export default function MisPagos() {
  const { token } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerMisPagos(token)
      .then(({ pagos }) => setPagos(pagos))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar tus pagos."));
  }, [token]);

  if (error) {
    return (
      <main className="wide">
        <p role="alert">{error}</p>
      </main>
    );
  }

  return (
    <main className="wide">
      <h1>Mis Pagos</h1>
      <p style={{ color: "var(--muted)" }}>Pagos de mensualidad registrados por tu entrenador.</p>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {pagos.map((pago) => (
          <div key={pago.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{pago.concepto}</strong>
              <p style={{ margin: 0, color: "var(--muted)" }}>
                {new Date(pago.fecha).toLocaleDateString("es-DO")}
                {pago.estado === "pagado" && pago.trainer_nombre && ` · Confirmado por ${pago.trainer_nombre} ${pago.trainer_apellido ?? ""}`.trimEnd()}
              </p>
              <p style={{ margin: 0, color: "var(--muted)" }}>Concepto de pago: Transferencia</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{money(pago.monto)}</p>
              <span
                className="tag"
                style={{
                  background: pago.estado === "pagado" ? "var(--oks)" : "var(--danger-bg)",
                  color: pago.estado === "pagado" ? "var(--ok)" : "var(--danger)",
                }}
              >
                {pago.estado === "pagado" ? "Pagado" : "Pendiente"}
              </span>
            </div>
          </div>
        ))}
        {pagos.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no tienes pagos de mensualidad registrados.</p>}
      </div>

      <p style={{ marginTop: 24, color: "var(--muted)", fontSize: 13 }}>
        Los pagos por compra de productos aparecen en <strong>Mis Facturas</strong>.
      </p>
    </main>
  );
}
