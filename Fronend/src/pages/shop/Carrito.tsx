import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { actualizarCantidadCarrito, agregarAlCarrito, crearPedido, obtenerCarrito, quitarDelCarrito, type CartItem } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { money } from "../../lib/money";
import ProductModal from "../../components/ProductModal";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Carrito() {
  const { token } = useAuth();
  const { refrescarCarrito } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith("/entrenador") ? "/entrenador" : "/portal";
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [productoAbierto, setProductoAbierto] = useState<number | null>(null);

  function cargar() {
    if (!token) return;
    obtenerCarrito(token)
      .then((respuesta) => {
        setItems(respuesta.items);
        setTotal(respuesta.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el carrito."));
  }

  useEffect(cargar, [token]);

  async function handleCantidad(productId: number, qty: number) {
    if (!token || qty < 1) return;
    await actualizarCantidadCarrito(token, productId, qty);
    cargar();
    refrescarCarrito();
  }

  async function handleQuitar(productId: number) {
    if (!token) return;
    await quitarDelCarrito(token, productId);
    cargar();
    refrescarCarrito();
  }

  async function handleAgregarDesdeModal(productId: number) {
    if (!token) return;
    setMensaje(null);
    try {
      await agregarAlCarrito(token, productId);
      setMensaje("Producto agregado al carrito.");
      setProductoAbierto(null);
      cargar();
      refrescarCarrito();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function handleComprarAhora(productId: number, qty: number) {
    if (!token) return;
    setError(null);
    setMensaje(null);
    try {
      await crearPedido(token, { productId, qty });
      setProductoAbierto(null);
      cargar();
      refrescarCarrito();
      navigate(`${base}/pedidos`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function handleCheckout() {
    if (!token) return;
    setError(null);
    setProcesando(true);
    try {
      await crearPedido(token);
      refrescarCarrito();
      navigate(`${base}/pedidos`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <main className="wide">
      <h1>Carrito</h1>

      {error && <p role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}

      {items.length === 0 && <p style={{ color: "var(--muted)" }}>Tu carrito está vacío.</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 220px))", gap: 16 }}>
        {items.map((item) => (
          <div key={item.id} className="product-card" style={{ maxWidth: 220 }}>
            <div onClick={() => setProductoAbierto(item.id)} style={{ cursor: "pointer" }}>
              <div
                className="product-image"
                style={item.images[0] ? { backgroundImage: `url(${API_URL}${item.images[0]})` } : undefined}
              >
                {!item.images[0] && item.cat}
              </div>
              <div className="product-body">
                <h3 style={{ margin: "4px 0", fontSize: 16 }}>{item.name}</h3>
                <p style={{ color: "var(--accent2)", fontWeight: 700, fontSize: 18, margin: 0 }}>{money(item.price)} c/u</p>
                <div className="product-tags">
                  {item.goals.map((g) => (
                    <span key={g} className="tag">{g}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "0 14px 14px", flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) => handleCantidad(item.id, Number(e.target.value))}
                style={{ width: 60 }}
              />
              <button type="button" className="secondary" onClick={() => handleQuitar(item.id)}>Quitar</button>
            </div>
            <div style={{ padding: "0 14px 14px" }} onClick={(e) => e.stopPropagation()}>
              <button type="button" className="secondary" style={{ width: "100%", fontSize: 13 }} onClick={() => handleComprarAhora(item.id, item.qty)}>
                Comprar solo este
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="card" style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: 20 }}>Total: {money(total)}</strong>
          <button type="button" onClick={handleCheckout} disabled={procesando}>
            {procesando ? "Procesando..." : "Confirmar pedido"}
          </button>
        </div>
      )}

      {productoAbierto && (
        <ProductModal
          productId={productoAbierto}
          onClose={() => setProductoAbierto(null)}
          onAgregar={handleAgregarDesdeModal}
          onComprarAhora={(id) => {
            const item = items.find((i) => i.id === id);
            handleComprarAhora(id, item?.qty ?? 1);
          }}
        />
      )}
    </main>
  );
}
