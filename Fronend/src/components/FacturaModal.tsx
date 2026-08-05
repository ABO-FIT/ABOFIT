import { useEffect, useState } from "react";
import { obtenerDetalleFactura, obtenerDetalleFacturaAdmin, subirComprobante, type DetalleFactura } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { money } from "../lib/money";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function FacturaModal({
  facturaId,
  esAdmin = false,
  onClose,
}: {
  facturaId: number;
  esAdmin?: boolean;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [detalle, setDetalle] = useState<DetalleFactura | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  function cargarDetalle() {
    if (!token) return;
    const consulta = esAdmin ? obtenerDetalleFacturaAdmin(token, facturaId) : obtenerDetalleFactura(token, facturaId);
    consulta.then(setDetalle).catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la factura."));
  }

  useEffect(cargarDetalle, [token, facturaId, esAdmin]);

  async function handleSubirComprobante() {
    if (!token || !archivo) return;
    setError(null);
    setMensaje(null);
    setSubiendo(true);
    try {
      const respuesta = await subirComprobante(token, facturaId, archivo);
      setMensaje(respuesta.message);
      setArchivo(null);
      cargarDetalle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el comprobante.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>

        {error && <p role="alert">{error}</p>}
        {!detalle && !error && <p>Cargando...</p>}

        {detalle && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0 }}>{detalle.plantilla?.companyName ?? "ABOFIT"}</h2>
                {detalle.plantilla?.tagline && <p style={{ color: "var(--muted)", margin: 0 }}>{detalle.plantilla.tagline}</p>}
                {detalle.plantilla?.address && <p style={{ color: "var(--muted)", margin: 0, fontSize: 13 }}>{detalle.plantilla.address}</p>}
                {detalle.plantilla?.phone && <p style={{ color: "var(--muted)", margin: 0, fontSize: 13 }}>{detalle.plantilla.phone} {detalle.plantilla?.email ? `· ${detalle.plantilla.email}` : ""}</p>}
                {detalle.plantilla?.taxId && <p style={{ color: "var(--muted)", margin: 0, fontSize: 13 }}>RNC: {detalle.plantilla.taxId}</p>}
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontFamily: "var(--disp)", fontWeight: 700, fontSize: 20 }}>{detalle.factura.numero}</p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{new Date(detalle.factura.fecha).toLocaleDateString("es-DO")}</p>
                <span
                  className="tag"
                  style={{
                    marginTop: 4,
                    display: "inline-block",
                    background: detalle.factura.estado === "pagada" ? "var(--oks)" : "var(--danger-bg)",
                    color: detalle.factura.estado === "pagada" ? "var(--ok)" : "var(--danger)",
                  }}
                >
                  {detalle.factura.estado === "pagada" ? "Pagada" : "Pendiente"}
                </span>
              </div>
            </div>

            <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid var(--line)" }} />

            <p style={{ margin: 0, fontWeight: 600 }}>Facturado a</p>
            <p style={{ margin: 0 }}>{detalle.cliente.nombre} {detalle.cliente.apellido}</p>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{detalle.cliente.correo} · {detalle.cliente.telefono}</p>

            <table style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalle.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>{money(item.price)}</td>
                    <td>{money(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: "right", marginTop: 12 }}>
              <strong style={{ fontSize: 20 }}>Total: {money(detalle.factura.monto)}</strong>
            </div>

            {detalle.factura.estado === "pendiente" && detalle.plantilla?.bankName && (
              <div className="card" style={{ marginTop: 16, background: "var(--bg)" }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Datos para pago</p>
                <p style={{ margin: 0, fontSize: 13 }}>Banco: {detalle.plantilla.bankName}</p>
                {detalle.plantilla.bankAccount && <p style={{ margin: 0, fontSize: 13 }}>Cuenta: {detalle.plantilla.bankAccount}</p>}
                {detalle.plantilla.bankHolder && <p style={{ margin: 0, fontSize: 13 }}>Titular: {detalle.plantilla.bankHolder}</p>}
              </div>
            )}

            {!esAdmin && detalle.factura.estado === "pendiente" && (
              <div className="card" style={{ marginTop: 16 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Comprobante de pago</p>
                {detalle.factura.comprobantePath ? (
                  <>
                    <p style={{ margin: "6px 0", fontSize: 13, color: "var(--muted)" }}>
                      Ya enviaste un comprobante. Un administrador confirmará tu pago pronto. Si necesitas reemplazarlo, sube uno nuevo.
                    </p>
                    <img
                      src={`${API_URL}${detalle.factura.comprobantePath}`}
                      alt="Comprobante de pago"
                      style={{ width: "100%", maxWidth: 260, borderRadius: 8, display: "block", marginBottom: 10 }}
                    />
                  </>
                ) : (
                  <p style={{ margin: "6px 0", fontSize: 13, color: "var(--muted)" }}>
                    Después de transferir, sube una foto o captura del comprobante para que podamos confirmar tu pago.
                  </p>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
                <button type="button" style={{ marginTop: 8 }} disabled={!archivo || subiendo} onClick={handleSubirComprobante}>
                  {subiendo ? "Subiendo..." : detalle.factura.comprobantePath ? "Reemplazar comprobante" : "Subir comprobante"}
                </button>
                {mensaje && <p role="status" style={{ marginTop: 8 }}>{mensaje}</p>}
              </div>
            )}

            {esAdmin && detalle.factura.comprobantePath && (
              <div className="card" style={{ marginTop: 16 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Comprobante enviado por el cliente</p>
                <a href={`${API_URL}${detalle.factura.comprobantePath}`} target="_blank" rel="noreferrer">
                  <img
                    src={`${API_URL}${detalle.factura.comprobantePath}`}
                    alt="Comprobante de pago"
                    style={{ width: "100%", maxWidth: 320, borderRadius: 8, display: "block", marginTop: 8 }}
                  />
                </a>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)" }}>Haz clic en la imagen para verla en tamaño completo.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
