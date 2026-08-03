import { useEffect, useState } from "react";
import { cambiarEstadoFactura, obtenerFacturasAdmin, type FacturaAdmin } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

export default function Facturas() {
  const { token } = useAuth();
  const [facturas, setFacturas] = useState<FacturaAdmin[]>([]);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState<string | null>(null);

  function cargar() {
    if (!token) return;
    obtenerFacturasAdmin(token, filtro || undefined)
      .then(({ facturas }) => setFacturas(facturas))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar las facturas."));
  }

  useEffect(cargar, [token, filtro]);

  async function marcarPagada(id: number, estado: "pendiente" | "pagada") {
    if (!token) return;
    await cambiarEstadoFactura(token, id, estado);
    cargar();
  }

  return (
    <main className="wide">
      <h1>Facturas</h1>

      <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ marginBottom: 16 }}>
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="pagada">Pagada</option>
      </select>

      {error && <p role="alert">{error}</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {facturas.map((factura) => (
          <div key={factura.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <strong>Factura {factura.numero}</strong>
              <p style={{ margin: 0, color: "var(--muted)" }}>
                {factura.cliente.nombre} {factura.cliente.apellido} · {factura.cliente.correo} · Pedido #{factura.orderId}
              </p>
              <p style={{ margin: 0, color: "var(--muted)" }}>{new Date(factura.fecha).toLocaleDateString("es-DO")}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong>{money(factura.monto)}</strong>
              <select value={factura.estado} onChange={(e) => marcarPagada(factura.id, e.target.value as "pendiente" | "pagada")}>
                <option value="pendiente">Pendiente</option>
                <option value="pagada">Pagada</option>
              </select>
            </div>
          </div>
        ))}
        {facturas.length === 0 && <p style={{ color: "var(--muted)" }}>Sin facturas.</p>}
      </div>
    </main>
  );
}
