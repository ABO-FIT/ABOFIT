import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { obtenerCatalogo, obtenerObjetivos, type GoalAdmin, type Producto } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { money } from "../lib/money";
import ProductModal from "../components/ProductModal";
import logo from "../assets/brand/logo-onlight.png";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function CatalogoPublico() {
  const { usuario } = useAuth();
  const { carritoLocal, agregarLocal, actualizarCantidadLocal, quitarLocal } = useCart();
  const navigate = useNavigate();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [objetivos, setObjetivos] = useState<GoalAdmin[]>([]);
  const [goal, setGoal] = useState("");
  const [cat, setCat] = useState("");
  const [buscar, setBuscar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [productoAbierto, setProductoAbierto] = useState<number | null>(null);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  function cargar() {
    obtenerCatalogo(null, { goal: goal || undefined, cat: cat || undefined, buscar: buscar || undefined })
      .then((respuesta) => {
        setProductos(respuesta.productos);
        setCategorias(respuesta.categorias);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el catálogo."));
  }

  useEffect(cargar, [goal, cat]);
  useEffect(() => {
    obtenerObjetivos(null).then(({ goals }) => setObjetivos(goals)).catch(() => {});
  }, []);

  function handleBuscarSubmit(event: FormEvent) {
    event.preventDefault();
    cargar();
  }

  function cartQty(productId: number): number {
    return carritoLocal.find((i) => i.productId === productId)?.qty ?? 0;
  }

  function handleAgregar(producto: Producto) {
    agregarLocal(producto, 1);
  }

  function handleAgregarDesdeModal(productId: number) {
    const producto = productos.find((p) => p.id === productId);
    if (producto) agregarLocal(producto, 1);
    setProductoAbierto(null);
  }

  const totalCarrito = carritoLocal.reduce((suma, item) => suma + item.price * item.qty, 0);
  const cantidadCarrito = carritoLocal.reduce((suma, item) => suma + item.qty, 0);

  function handleFinalizarCompra() {
    if (usuario) {
      const base = usuario.rol === "Entrenador" ? "/entrenador" : "/portal";
      navigate(`${base}/carrito`);
      return;
    }
    navigate("/registro");
  }

  return (
    <div>
      <div style={{ background: "var(--ink)", color: "#fff", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <img src={logo} alt="ABOFIT" style={{ height: 34 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {usuario ? (
            <Link to={usuario.rol === "Entrenador" ? "/entrenador/panel" : usuario.rol === "Administrador" ? "/admin/panel" : "/portal/hoy"} style={{ color: "#fff" }}>
              Ir a mi cuenta
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ color: "#fff" }}>Iniciar sesión</Link>
              <Link to="/registro" style={{ color: "#fff", fontWeight: 700 }}>Crear cuenta</Link>
            </>
          )}
          <button type="button" className="secondary" onClick={() => setCarritoAbierto((v) => !v)} style={{ position: "relative" }}>
            🛒 Carrito
            {cantidadCarrito > 0 && (
              <span style={{ marginLeft: 6, background: "var(--accent2)", color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "2px 7px" }}>
                {cantidadCarrito}
              </span>
            )}
          </button>
        </div>
      </div>

      <main className="wide">
        <span className="eyebrow">Suplementos ABOFIT</span>
        <h1>Catálogo</h1>
        <p style={{ color: "var(--muted)" }}>
          Explora nuestros productos libremente. Puedes agregar al carrito sin crear una cuenta — solo la necesitarás
          para finalizar la compra, y lo que hayas agregado se mantendrá esperándote.
        </p>

        {carritoAbierto && (
          <div className="card" style={{ marginTop: 16, borderColor: "var(--accent2)" }}>
            <h3 style={{ margin: "0 0 12px" }}>Tu carrito</h3>
            {carritoLocal.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no has agregado productos.</p>}
            <div style={{ display: "grid", gap: 8 }}>
              {carritoLocal.map((item) => (
                <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <strong>{item.name}</strong>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{money(item.price)} c/u</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button type="button" className="secondary" style={{ padding: "2px 10px" }} onClick={() => (item.qty <= 1 ? quitarLocal(item.productId) : actualizarCantidadLocal(item.productId, item.qty - 1))}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 18, textAlign: "center" }}>{item.qty}</span>
                    <button type="button" style={{ padding: "2px 10px" }} disabled={item.qty >= item.stock} onClick={() => actualizarCantidadLocal(item.productId, item.qty + 1)}>+</button>
                    <button type="button" className="secondary" style={{ color: "var(--accent2)" }} onClick={() => quitarLocal(item.productId)}>Quitar</button>
                  </div>
                </div>
              ))}
            </div>
            {carritoLocal.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
                <strong style={{ fontSize: 18 }}>Total: {money(totalCarrito)}</strong>
                <button type="button" onClick={handleFinalizarCompra}>Finalizar compra</button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleBuscarSubmit} style={{ flexDirection: "row", marginTop: 16, marginBottom: 16 }}>
          <input placeholder="Buscar producto..." value={buscar} onChange={(e) => setBuscar(e.target.value)} style={{ flex: 1 }} />
          <button type="submit">Buscar</button>
        </form>

        <span className="section-label">Filtra por objetivo</span>
        <div className="pill-group" style={{ marginBottom: 16 }}>
          <button type="button" className={`pill ${goal === "" ? "active" : ""}`} onClick={() => setGoal("")}>
            Todos los objetivos
          </button>
          {objetivos.map((o) => (
            <button key={o.key} type="button" className={`pill ${goal === o.key ? "active" : ""}`} onClick={() => setGoal(o.key)}>
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
                  </div>
                  <div className="product-body">
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
                      <button type="button" className="secondary" style={{ padding: "2px 10px", fontSize: 16 }} onClick={() => actualizarCantidadLocal(producto.id, qty - 1)}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 18, textAlign: "center" }}>{qty}</span>
                      <button type="button" style={{ padding: "2px 10px", fontSize: 16 }} disabled={qty >= producto.stock} onClick={() => actualizarCantidadLocal(producto.id, qty + 1)}>+</button>
                    </>
                  ) : (
                    <button type="button" className="secondary" style={{ fontSize: 12 }} disabled={producto.stock <= 0} onClick={() => handleAgregar(producto)}>
                      {producto.stock <= 0 ? "Agotado" : "+ Agregar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {productos.length === 0 && <p style={{ color: "var(--muted)" }}>Sin productos que coincidan.</p>}
        </div>

        {productoAbierto && (
          <ProductModal productId={productoAbierto} onClose={() => setProductoAbierto(null)} onAgregar={handleAgregarDesdeModal} />
        )}
      </main>
    </div>
  );
}
