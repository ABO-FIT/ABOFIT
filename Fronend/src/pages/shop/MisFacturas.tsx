import { useEffect, useState } from "react";
import { obtenerFacturas, type Factura } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";
import FacturaModal from "../../components/FacturaModal";
import ErrorReintentar from "../../components/ErrorReintentar";

export default function MisFacturas() {
  const { token } = useAuth();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [facturaAbierta, setFacturaAbierta] = useState<number | null>(null);

  function cargar() {
    if (!token) return;
    setError(null);
    obtenerFacturas(token)
      .then(({ facturas }) => setFacturas(facturas))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar tus facturas."));
  }

  useEffect(cargar, [token]);

  if (error) {
    return <ErrorReintentar mensaje={error} onReintentar={cargar} />;
  }

  return (
    <main className="wide">
      <h1>Mis Facturas</h1>

      {facturas.length === 0 && (
        <p style={{ color: "var(--muted)" }}>
          Aún no tienes facturas. Se generan cuando el administrador confirma tu pago (revisa Mis Pedidos para subir tu comprobante).
        </p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {facturas.map((factura) => (
          <button
            key={factura.id}
            type="button"
            className="card"
            style={{ display: "flex", justifyContent: "space-between", textAlign: "left", width: "100%" }}
            onClick={() => setFacturaAbierta(factura.id)}
          >
            <div>
              <strong>Factura {factura.numero}</strong>
              <p style={{ margin: 0, color: "var(--muted)" }}>{new Date(factura.fecha).toLocaleDateString("es-DO")} · Pedido #{factura.order_id}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{money(factura.monto)}</p>
              <span
                className="tag"
                style={{
                  background: factura.estado === "pagada" ? "var(--oks)" : "var(--danger-bg)",
                  color: factura.estado === "pagada" ? "var(--ok)" : "var(--danger)",
                }}
              >
                {factura.estado === "pagada" ? "Pagada" : "Pendiente"}
              </span>
            </div>
          </button>
        ))}
      </div>

      {facturaAbierta && <FacturaModal facturaId={facturaAbierta} onClose={() => setFacturaAbierta(null)} />}
    </main>
  );
}
