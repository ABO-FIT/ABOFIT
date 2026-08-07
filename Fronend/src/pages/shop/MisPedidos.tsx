import { useEffect, useState } from "react";
import { obtenerPedidos, subirComprobantePedido, type Pedido } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";
import ProductModal from "../../components/ProductModal";
import FacturaModal from "../../components/FacturaModal";
import ErrorReintentar from "../../components/ErrorReintentar";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const ESTADOS: Record<Pedido["estado"], string> = {
  pendiente: "Pendiente",
  recibido: "Recibido",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function PagoPedido({ pedido, onSubido }: { pedido: Pedido; onSubido: () => void }) {
  const { token } = useAuth();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (pedido.estado === "cancelado") {
    return null;
  }

  async function handleSubir() {
    if (!token || !archivo) return;
    setError(null);
    setMensaje(null);
    setSubiendo(true);
    try {
      const respuesta = await subirComprobantePedido(token, pedido.id, archivo);
      setMensaje(respuesta.message);
      setArchivo(null);
      onSubido();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el comprobante.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
      <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 14 }}>Comprobante de pago</p>
      {pedido.comprobantePath ? (
        <>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
            Ya enviaste un comprobante. Un administrador confirmará tu pago pronto. Si necesitas reemplazarlo, sube uno nuevo.
          </p>
          <img
            src={`${API_URL}${pedido.comprobantePath}`}
            alt="Comprobante de pago"
            style={{ width: "100%", maxWidth: 220, borderRadius: 8, display: "block", marginBottom: 10 }}
          />
        </>
      ) : (
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
          Después de transferir, sube una foto o captura del comprobante para que podamos confirmar tu pago.
        </p>
      )}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
      <button type="button" style={{ marginTop: 8, display: "block" }} disabled={!archivo || subiendo} onClick={handleSubir}>
        {subiendo ? "Subiendo..." : pedido.comprobantePath ? "Reemplazar comprobante" : "Subir comprobante"}
      </button>
      {mensaje && <p role="status" style={{ marginTop: 8, fontSize: 13 }}>{mensaje}</p>}
      {error && <p role="alert" style={{ marginTop: 8, fontSize: 13 }}>{error}</p>}
    </div>
  );
}

export default function MisPedidos() {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [productoAbierto, setProductoAbierto] = useState<number | null>(null);
  const [facturaAbierta, setFacturaAbierta] = useState<number | null>(null);

  function cargar() {
    if (!token) return;
    setError(null);
    obtenerPedidos(token)
      .then(({ pedidos }) => setPedidos(pedidos))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar tus pedidos."));
  }

  useEffect(cargar, [token]);

  if (error) {
    return <ErrorReintentar mensaje={error} onReintentar={cargar} />;
  }

  return (
    <main className="wide">
      <h1>Mis Pedidos</h1>

      {pedidos.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no has hecho pedidos.</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="card" style={{ width: "fit-content", minWidth: 280, maxWidth: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <strong>Pedido #{pedido.id}</strong>
              <span className="tag" style={{ background: "var(--line)" }}>{ESTADOS[pedido.estado]}</span>
            </div>
            <p style={{ color: "var(--muted)", margin: "4px 0 10px" }}>{new Date(pedido.fecha).toLocaleDateString("es-DO")}</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))", gap: 16 }}>
              {pedido.items.map((item, index) => (
                <div key={index} className="product-card" style={{ maxWidth: 220 }}>
                  <div
                    onClick={() => item.productId && setProductoAbierto(item.productId)}
                    style={{ cursor: item.productId ? "pointer" : "default" }}
                  >
                    <div
                      className="product-image"
                      style={item.images[0] ? { backgroundImage: `url(${API_URL}${item.images[0]})` } : undefined}
                    >
                      {!item.images[0] && (item.cat ?? "Producto")}
                    </div>
                    <div className="product-body">
                      <h3 style={{ margin: "4px 0", fontSize: 16 }}>{item.name}</h3>
                      <p style={{ color: "var(--accent2)", fontWeight: 700, fontSize: 18, margin: 0 }}>{money(item.price)}</p>
                      {item.goals.length > 0 && (
                        <div className="product-tags">
                          {item.goals.map((g) => (
                            <span key={g} className="tag">{g}</span>
                          ))}
                        </div>
                      )}
                      {!item.productId && (
                        <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--muted)" }}>Producto ya no disponible en el catálogo.</p>
                      )}
                    </div>
                  </div>

                  <div className="product-actions" style={{ padding: "0 14px 14px", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>Comprado: <strong style={{ color: "var(--text)" }}>{item.qty}</strong></span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{money(item.price * item.qty)}</span>
                  </div>
                </div>
              ))}
            </div>

            <strong style={{ display: "block", marginTop: 12 }}>Total: {money(pedido.total)}</strong>

            {pedido.facturaId ? (
              <button type="button" className="secondary" style={{ marginTop: 12 }} onClick={() => setFacturaAbierta(pedido.facturaId)}>
                Ver factura {pedido.facturaNumero}
              </button>
            ) : (
              <PagoPedido pedido={pedido} onSubido={cargar} />
            )}
          </div>
        ))}
      </div>

      {productoAbierto && (
        <ProductModal productId={productoAbierto} onClose={() => setProductoAbierto(null)} />
      )}

      {facturaAbierta && <FacturaModal facturaId={facturaAbierta} onClose={() => setFacturaAbierta(null)} />}
    </main>
  );
}
