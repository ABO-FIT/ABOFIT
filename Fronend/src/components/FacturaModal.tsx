import { useEffect, useState } from "react";
import { obtenerDetalleFactura, obtenerDetalleFacturaAdmin, type DetalleFactura } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { money } from "../lib/money";
import logoOnLight from "../assets/brand/logo-onlight.png";

function fmtFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" });
}

function rolLabel(rol: string): string {
  return rol === "Entrenador" ? "Entrenador" : "Cliente";
}

function InvoiceDoc({ detalle }: { detalle: DetalleFactura }) {
  const { factura, cliente, items, plantilla } = detalle;
  const t = plantilla;
  const hasBankInfo = !!(t?.bankName || t?.bankAccount);

  return (
    <div id="invoice-print" style={{ fontFamily: "Arial, sans-serif", color: "#111", padding: "40px 48px", maxWidth: 680, margin: "0 auto", background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #e85d04", paddingBottom: 18, marginBottom: 24 }}>
        <div>
          <img src={logoOnLight} alt={t?.companyName || "ABOFIT"} style={{ height: 52, width: "auto", display: "block", marginBottom: 6 }} />
          {t?.tagline && <div style={{ fontSize: 12, color: "#555" }}>{t.tagline}</div>}
          {t?.email && <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{t.email}</div>}
          {t?.phone && <div style={{ fontSize: 11, color: "#777" }}>{t.phone}</div>}
          {t?.address && <div style={{ fontSize: 11, color: "#777" }}>{t.address}</div>}
          {t?.taxId && <div style={{ fontSize: 11, color: "#777" }}>RNC/Cédula: {t.taxId}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#222" }}>FACTURA</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e85d04", marginTop: 4 }}>{factura.numero}</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Fecha: {fmtFecha(factura.fecha)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 24, background: "#f9f9f9", borderRadius: 8, padding: "14px 18px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#e85d04", textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 }}>Facturado a</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{cliente.nombre} {cliente.apellido}</div>
        <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{rolLabel(cliente.rol)} · {cliente.correo}</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
        <thead>
          <tr style={{ background: "#e85d04" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#fff" }}>Producto</th>
            <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>Cant.</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#fff" }}>Precio Unit.</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#fff" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px 12px", fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                {item.cat && <div style={{ fontSize: 11, color: "#888" }}>{item.cat}</div>}
              </td>
              <td style={{ padding: "10px 12px", textAlign: "center", fontSize: 13 }}>{item.qty}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13 }}>{money(item.price)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, fontWeight: 600 }}>{money(item.price * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: hasBankInfo ? "space-between" : "flex-end", alignItems: "flex-start", marginBottom: 28, gap: 24, flexWrap: "wrap" }}>
        {hasBankInfo && (
          <div style={{ background: "#f0f4ff", borderRadius: 8, padding: "12px 16px", minWidth: 220 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Datos para pago / depósito</div>
            {t?.bankName && <div style={{ fontSize: 12, marginBottom: 3 }}><strong>Banco:</strong> {t.bankName}</div>}
            {t?.bankAccount && <div style={{ fontSize: 12, marginBottom: 3 }}><strong>Cuenta:</strong> {t.bankAccount}</div>}
            {t?.bankHolder && <div style={{ fontSize: 12 }}><strong>A nombre de:</strong> {t.bankHolder}</div>}
          </div>
        )}
        <div style={{ minWidth: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#e85d04", borderRadius: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>TOTAL A PAGAR</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>{money(factura.monto)}</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #eee", paddingTop: 16, textAlign: "center", fontSize: 11, color: "#aaa" }}>
        Pedido ref. {String(factura.orderId).padStart(8, "0")} · Generado el {fmtFecha(factura.fecha)} · {t?.companyName || "ABOFIT"} © {new Date().getFullYear()}
      </div>
    </div>
  );
}

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

  useEffect(() => {
    if (!token) return;
    const consulta = esAdmin ? obtenerDetalleFacturaAdmin(token, facturaId) : obtenerDetalleFactura(token, facturaId);
    consulta.then(setDetalle).catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la factura."));
  }, [token, facturaId, esAdmin]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 720, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        {detalle && (
          <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Factura {detalle.factura.numero}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={{ padding: "8px 13px", fontSize: 13, borderRadius: 9 }} onClick={handlePrint}>
                🖨 Imprimir / Guardar PDF
              </button>
              <button type="button" className="secondary" style={{ padding: "8px 13px", fontSize: 13, borderRadius: 9 }} onClick={onClose}>
                ✕ Cerrar
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: detalle ? "24px 16px" : 24 }}>
          {!detalle && <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>}
          {error && <p role="alert">{error}</p>}
          {!detalle && !error && <p>Cargando...</p>}
          {detalle && <InvoiceDoc detalle={detalle} />}
        </div>
      </div>
    </div>
  );
}
