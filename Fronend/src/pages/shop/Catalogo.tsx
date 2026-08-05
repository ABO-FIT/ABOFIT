import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  actualizarCantidadCarrito,
  agregarAlCarrito,
  crearPedido,
  obtenerCarrito,
  obtenerCatalogo,
  obtenerObjetivos,
  quitarDelCarrito,
  type CartItem,
  type GoalAdmin,
  type Producto,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { money } from "../../lib/money";
import ProductModal from "../../components/ProductModal";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Catalogo() {
  const { token } = useAuth();
  const { refrescarCarrito } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith("/entrenador") ? "/entrenador" : "/portal";
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [objetivos, setObjetivos] = useState<GoalAdmin[]>([]);
  const [carritoItems, setCarritoItems] = useState<CartItem[]>([]);
  const [goal, setGoal] = useState("");
  const [cat, setCat] = useState("");
  const [buscar, setBuscar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [productoAbierto, setProductoAbierto] = useState<number | null>(null);

  function cargar() {
    obtenerCatalogo(token, { goal: goal || undefined, cat: cat || undefined, buscar: buscar || undefined })
      .then((respuesta) => {
        setProductos(respuesta.productos);
        setCategorias(respuesta.categorias);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el catálogo."));
  }

  function cargarCarrito() {
    if (!token) return;
    obtenerCarrito(token).then(({ items }) => setCarritoItems(items)).catch(() => {});
  }

  useEffect(cargar, [token, goal, cat]);
  useEffect(cargarCarrito, [token]);
  useEffect(() => {
    obtenerObjetivos(token).then(({ goals }) => setObjetivos(goals)).catch(() => {});
  }, [token]);

  function handleBuscarSubmit(event: FormEvent) {
    event.preventDefault();
    cargar();
  }

  function cartQty(productId: number): number {
    return carritoItems.find((i) => i.id === productId)?.qty ?? 0;
  }

  async function handleIncrementar(productId: number) {
    if (!token) return;
    setError(null);
    try {
      await agregarAlCarrito(token, productId, 1);
      cargarCarrito();
      refrescarCarrito();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function handleDecrementar(productId: number) {
    if (!token) return;
    setError(null);
    const qtyActual = cartQty(productId);
    try {
      if (qtyActual <= 1) {
        await quitarDelCarrito(token, productId);
      } else {
        await actualizarCantidadCarrito(token, productId, qtyActual - 1);
      }
      cargarCarrito();
      refrescarCarrito();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function handleAgregarDesdeModal(productId: number) {
    await handleIncrementar(productId);
    setProductoAbierto(null);
  }

  async function handleComprarAhora(productId: number) {
    if (!token) return;
    setError(null);
    try {
      await crearPedido(token, { productId, qty: 1 });
      setProductoAbierto(null);
      refrescarCarrito();
      navigate(`${base}/pedidos`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  return (
    <main className="wide">
      <span className="eyebrow">Suplementos ABOFIT</span>
      <h1>Suplementos</h1>

      <form onSubmit={handleBuscarSubmit} style={{ flexDirection: "row", marginBottom: 16 }}>
        <input placeholder="Buscar producto..." value={buscar} onChange={(e) => setBuscar(e.target.value)} style={{ flex: 1 }} />
        <button type="submit">Buscar</button>
      </form>

      <span className="section-label">Filtra por objetivo</span>
      <div className="pill-group" style={{ marginBottom: 16 }}>
        <button type="button" className={`pill ${goal === "" ? "active" : ""}`} onClick={() => setGoal("")}>
          Todos los objetivos
        </button>
        {objetivos.map((o) => (
          <button
            key={o.key}
            type="button"
            className={`pill ${goal === o.key ? "active" : ""}`}
            onClick={() => setGoal(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <span className="section-label">Categorías</span>
      <div className="pill-group" style={{ marginBottom: 24 }}>
        <button type="button" className={`pill ${cat === "" ? "active" : ""}`} onClick={() => setCat("")}>
          Todas
        </button>
        {categorias.map((c) => (
          <button key={c} type="button" className={`pill ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {error && <p role="alert">{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 220px))", gap: 16 }}>
        {productos.map((producto) => {
          const qty = cartQty(producto.id);
          return (
            <div key={producto.id} className="product-card" style={{ maxWidth: 220 }}>
              <div onClick={() => setProductoAbierto(producto.id)} style={{ cursor: "pointer" }}>
                <div
                  className="product-image"
                  style={producto.images[0] ? { backgroundImage: `url(${API_URL}${producto.images[0]})` } : undefined}
                >
                  {!producto.images[0] && producto.cat}
                  {producto.images.length > 1 && (
                    <span style={{ position: "absolute", bottom: 7, right: 8, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20 }}>
                      +{producto.images.length - 1}
                    </span>
                  )}
                </div>
                <div className="product-body">
                  {producto.recomendado && (
                    <span className="tag" style={{ background: "var(--oks)", color: "var(--ok)", marginBottom: 6 }}>
                      Recomendado
                    </span>
                  )}
                  <h3 style={{ margin: "4px 0", fontSize: 16 }}>{producto.name}</h3>
                  <p style={{ color: "var(--accent2)", fontWeight: 700, fontSize: 18, margin: 0 }}>{money(producto.price)}</p>
                  <div className="product-tags">
                    {producto.goals.map((g) => (
                      <span key={g} className="tag">{g}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="product-actions" style={{ padding: "0 14px 14px", alignItems: "center" }}>
                {qty > 0 ? (
                  <>
                    <button type="button" className="secondary" style={{ padding: "2px 10px", fontSize: 16 }} onClick={() => handleDecrementar(producto.id)}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 18, textAlign: "center" }}>{qty}</span>
                    <button type="button" style={{ padding: "2px 10px", fontSize: 16 }} onClick={() => handleIncrementar(producto.id)}>+</button>
                  </>
                ) : (
                  <button type="button" className="secondary" style={{ fontSize: 12 }} onClick={() => handleIncrementar(producto.id)}>+ Agregar</button>
                )}
              </div>
            </div>
          );
        })}
        {productos.length === 0 && <p style={{ color: "var(--muted)" }}>Sin productos que coincidan.</p>}
      </div>

      {productoAbierto && (
        <ProductModal
          productId={productoAbierto}
          onClose={() => setProductoAbierto(null)}
          onAgregar={handleAgregarDesdeModal}
          onComprarAhora={handleComprarAhora}
        />
      )}
    </main>
  );
}
