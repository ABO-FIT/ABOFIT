import { useEffect, useState } from "react";
import { agregarAlCarrito, obtenerCatalogo, type Producto } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

export default function Catalogo() {
  const { token } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [cat, setCat] = useState("");
  const [buscar, setBuscar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  function cargar() {
    obtenerCatalogo(token, { cat: cat || undefined, buscar: buscar || undefined })
      .then((respuesta) => {
        setProductos(respuesta.productos);
        setCategorias(respuesta.categorias);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el catálogo."));
  }

  useEffect(cargar, [token, cat]);

  function handleBuscarSubmit(event: React.FormEvent) {
    event.preventDefault();
    cargar();
  }

  async function handleAgregar(productId: number) {
    if (!token) return;
    setMensaje(null);
    try {
      await agregarAlCarrito(token, productId);
      setMensaje("Producto agregado al carrito.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  const recomendados = productos.filter((p) => p.recomendado);
  const resto = productos.filter((p) => !p.recomendado);

  return (
    <main className="wide">
      <h1>Catálogo</h1>

      <form onSubmit={handleBuscarSubmit} style={{ flexDirection: "row", marginBottom: 16 }}>
        <input placeholder="Buscar producto..." value={buscar} onChange={(e) => setBuscar(e.target.value)} style={{ flex: 1 }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit">Buscar</button>
      </form>

      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}

      {recomendados.length > 0 && (
        <>
          <h2>Recomendados para ti</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }}>
            {recomendados.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} onAgregar={handleAgregar} />
            ))}
          </div>
        </>
      )}

      <h2>Todos los productos</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {resto.map((producto) => (
          <ProductoCard key={producto.id} producto={producto} onAgregar={handleAgregar} />
        ))}
      </div>
    </main>
  );
}

function ProductoCard({ producto, onAgregar }: { producto: Producto; onAgregar: (id: number) => void }) {
  return (
    <div className="card">
      {producto.recomendado && <span className="tag" style={{ background: "var(--oks)", color: "var(--ok)" }}>Recomendado</span>}
      <h3 style={{ marginTop: 8 }}>{producto.name}</h3>
      <p style={{ color: "var(--muted)", margin: 0 }}>{producto.cat}</p>
      <p style={{ fontWeight: 700, fontSize: 18 }}>{money(producto.price)}</p>
      <button type="button" onClick={() => onAgregar(producto.id)}>Agregar al carrito</button>
    </div>
  );
}
