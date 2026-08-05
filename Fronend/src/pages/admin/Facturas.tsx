import { useEffect, useState } from "react";
import { cambiarEstadoFactura, obtenerFacturasAdmin, type FacturaAdmin } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";
import FacturaModal from "../../components/FacturaModal";

export default function Facturas() {
  const { token } = useAuth();
  const [facturas, setFacturas] = useState<FacturaAdmin[]>([]);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [facturaAbierta, setFacturaAbierta] = useState<number | null>(null);

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
            <button type="button" className="secondary" style={{ textAlign: "left" }} onClick={() => setFacturaAbierta(factura.id)}>
              <strong style={{ display: "block" }}>Factura {factura.numero}</strong>
              <span style={{ display: "block", color: "var(--muted)", fontSize: 13 }}>
                {factura.cliente.nombre} {factura.cliente.apellido} · {factura.cliente.correo} · Pedido #{factura.orderId}
              </span>
              <span style={{ display: "block", color: "var(--muted)", fontSize: 13 }}>{new Date(factura.fecha).toLocaleDateString("es-DO")}</span>
              {factura.estado === "pendiente" && (
                <span
                  className="tag"
                  style={{
                    marginTop: 4,
                    background: factura.comprobantePath ? "var(--oks)" : "var(--line)",
                    color: factura.comprobantePath ? "var(--ok)" : "var(--muted)",
                  }}
                >
                  {factura.comprobantePath ? "Comprobante enviado" : "Sin comprobante"}
                </span>
              )}
            </button>
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

      {facturaAbierta && <FacturaModal facturaId={facturaAbierta} esAdmin onClose={() => setFacturaAbierta(null)} />}
    </main>
  );
}
