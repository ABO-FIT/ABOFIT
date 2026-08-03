import { useEffect, useState, type FormEvent } from "react";
import { crearProducto, editarProducto, eliminarProducto, obtenerProductosAdmin, type ProductoAdmin, type ProductoFormPayload } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const OBJETIVOS = [
  { key: "", label: "Todos los objetivos" },
  { key: "masa", label: "Masa muscular" },
  { key: "grasa", label: "Pérdida de grasa" },
  { key: "mantenimiento", label: "Mantenimiento" },
  { key: "rendimiento", label: "Rendimiento" },
];

const VACIO: ProductoFormPayload = {
  cat: "", name: "", price: 0, stock: 0, goals: [],
  beneficios: "", indicaciones: "", ingredientes: "", descripcion: "", avisoSeguridad: "",
};

export default function CatalogoAdmin() {
  const { token } = useAuth();
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [goalFiltro, setGoalFiltro] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<ProductoFormPayload>(VACIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    if (!token) return;
    obtenerProductosAdmin(token)
      .then(({ productos }) => {
        setProductos(productos);
        setCategorias([...new Set(productos.map((p) => p.cat))]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los productos."));
  }

  useEffect(cargar, [token]);

  function toggleObjetivo(key: string) {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(key) ? f.goals.filter((g) => g !== key) : [...f.goals, key],
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);

    try {
      if (editandoId) {
        await editarProducto(token, editandoId, form);
      } else {
        await crearProducto(token, form);
      }
      setForm(VACIO);
      setEditandoId(null);
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  function editar(p: ProductoAdmin) {
    setEditandoId(p.id);
    setForm({
      cat: p.cat, name: p.name, price: p.price, stock: p.stock, goals: p.goals,
      beneficios: p.beneficios ?? "", indicaciones: p.indicaciones ?? "", ingredientes: p.ingredientes ?? "",
      descripcion: p.descripcion ?? "", avisoSeguridad: p.aviso_seguridad ?? "",
    });
    setMostrarForm(true);
  }

  function nuevo() {
    setEditandoId(null);
    setForm(VACIO);
    setMostrarForm(true);
  }

  async function eliminar(id: number) {
    if (!token) return;
    await eliminarProducto(token, id);
    cargar();
  }

  const productosFiltrados = productos.filter((p) => {
    if (goalFiltro && !p.goals.includes(goalFiltro)) return false;
    if (catFiltro && p.cat !== catFiltro) return false;
    return true;
  });

  return (
    <main className="wide">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span className="eyebrow">Suplementos ABOFIT</span>
          <h1>Suplementos</h1>
        </div>
        <button type="button" onClick={nuevo}>+ Nuevo producto</button>
      </div>

      <span className="section-label">Filtra por objetivo</span>
      <div className="pill-group" style={{ marginBottom: 16 }}>
        {OBJETIVOS.map((o) => (
          <button key={o.key} type="button" className={`pill ${goalFiltro === o.key ? "active" : ""}`} onClick={() => setGoalFiltro(o.key)}>
            {o.label}
          </button>
        ))}
      </div>

      <span className="section-label">Categorías</span>
      <div className="pill-group" style={{ marginBottom: 24 }}>
        <button type="button" className={`pill ${catFiltro === "" ? "active" : ""}`} onClick={() => setCatFiltro("")}>Todas</button>
        {categorias.map((c) => (
          <button key={c} type="button" className={`pill ${catFiltro === c ? "active" : ""}`} onClick={() => setCatFiltro(c)}>{c}</button>
        ))}
      </div>

      {error && <p role="alert">{error}</p>}

      {mostrarForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>{editandoId ? "Editar producto" : "Nuevo producto"}</h3>
          <form onSubmit={handleSubmit}>
            <label>Imagen</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setForm({ ...form, imagen: e.target.files?.[0] ?? null })} />

            <label>Categoría</label>
            <input value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })} required />
            <label>Nombre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <label>Precio (RD$)</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
            <label>Existencias</label>
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required />

            <label>Objetivos</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {OBJETIVOS.filter((o) => o.key).map((o) => (
                <button key={o.key} type="button" className={form.goals.includes(o.key) ? "" : "secondary"} onClick={() => toggleObjetivo(o.key)}>
                  {o.label}
                </button>
              ))}
            </div>

            <label>Beneficios (uno por línea)</label>
            <textarea rows={4} value={form.beneficios} onChange={(e) => setForm({ ...form, beneficios: e.target.value })} />

            <label>Indicaciones (uno por línea)</label>
            <textarea rows={3} value={form.indicaciones} onChange={(e) => setForm({ ...form, indicaciones: e.target.value })} />

            <label>Ingredientes (uno por línea)</label>
            <textarea rows={3} value={form.ingredientes} onChange={(e) => setForm({ ...form, ingredientes: e.target.value })} />

            <label>Descripción</label>
            <textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />

            <label>Aviso de Seguridad (uno por línea)</label>
            <textarea rows={3} value={form.avisoSeguridad} onChange={(e) => setForm({ ...form, avisoSeguridad: e.target.value })} />

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" disabled={guardando}>{editandoId ? "Guardar cambios" : "Crear producto"}</button>
              <button type="button" className="secondary" onClick={() => { setMostrarForm(false); setEditandoId(null); setForm(VACIO); }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {productosFiltrados.map((p) => (
          <div key={p.id} className="product-card">
            <div className="product-image" style={p.image_path ? { backgroundImage: `url(${API_URL}${p.image_path})` } : undefined}>
              {!p.image_path && p.cat}
            </div>
            <div className="product-body">
              <h3 style={{ margin: "4px 0", fontSize: 16 }}>{p.name}</h3>
              <p style={{ color: "var(--accent2)", fontWeight: 700, fontSize: 18, margin: 0 }}>{money(p.price)}</p>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0" }}>Stock: {p.stock}</p>
              <div className="product-tags">
                {p.goals.map((g) => <span key={g} className="tag">{g}</span>)}
              </div>
              <div className="product-actions">
                <button type="button" className="secondary" onClick={() => editar(p)}>Editar</button>
                <button type="button" className="secondary" onClick={() => eliminar(p.id)}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
