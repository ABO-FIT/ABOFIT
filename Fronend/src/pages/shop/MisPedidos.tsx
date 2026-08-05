import { useEffect, useState } from "react";
import { obtenerPedidos, type Pedido } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";
import ProductModal from "../../components/ProductModal";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const ESTADOS: Record<Pedido["estado"], string> = {
  pendiente: "Pendiente",
  recibido: "Recibido",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function MisPedidos() {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [productoAbierto, setProductoAbierto] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerPedidos(token)
      .then(({ pedidos }) => setPedidos(pedidos))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar tus pedidos."));
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
      <h1>Mis Pedidos</h1>

      {pedidos.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no has hecho pedidos.</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Pedido #{pedido.id}</strong>
              <span className="tag" style={{ background: "var(--line)" }}>{ESTADOS[pedido.estado]}</span>
            </div>
            <p style={{ color: "var(--muted)", margin: "4px 0 12px" }}>{new Date(pedido.fecha).toLocaleDateString("es-DO")}</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 220px))", gap: 12 }}>
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
                        <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)" }}>Producto ya no disponible en el catálogo.</p>
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
          </div>
        ))}
      </div>

      {productoAbierto && (
        <ProductModal productId={productoAbierto} onClose={() => setProductoAbierto(null)} />
      )}
    </main>
  );
}
