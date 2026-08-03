import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { actualizarCantidadCarrito, crearPedido, obtenerCarrito, quitarDelCarrito, type CartItem } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

export default function Carrito() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith("/entrenador") ? "/entrenador" : "/portal";
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

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
  }

  async function handleQuitar(productId: number) {
    if (!token) return;
    await quitarDelCarrito(token, productId);
    cargar();
  }

  async function handleCheckout() {
    if (!token) return;
    setError(null);
    setProcesando(true);
    try {
      await crearPedido(token);
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

      {items.length === 0 && <p style={{ color: "var(--muted)" }}>Tu carrito está vacío.</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <div key={item.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{item.name}</strong>
              <p style={{ margin: 0, color: "var(--muted)" }}>{item.cat} · {money(item.price)} c/u</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) => handleCantidad(item.id, Number(e.target.value))}
                style={{ width: 60 }}
              />
              <button type="button" className="secondary" onClick={() => handleQuitar(item.id)}>Quitar</button>
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
    </main>
  );
}
