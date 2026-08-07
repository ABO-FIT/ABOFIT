import { useEffect, useState, type FormEvent } from "react";
import {
  crearProducto,
  editarProducto,
  eliminarProducto,
  obtenerCategorias,
  obtenerObjetivos,
  obtenerProductosAdmin,
  type CategoriaAdmin,
  type GoalAdmin,
  type ImagenProducto,
  type ProductoAdmin,
  type ProductoFormPayload,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const MAX_IMAGENES = 3;

const VACIO: ProductoFormPayload = {
  cat: "", name: "", price: 0, stock: 0, goals: [],
  beneficios: "", indicaciones: "", ingredientes: "", descripcion: "", avisoSeguridad: "",
};

export default function CatalogoAdmin() {
  const { token } = useAuth();
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoriaAdmin[]>([]);
  const [objetivos, setObjetivos] = useState<GoalAdmin[]>([]);
  const [goalFiltro, setGoalFiltro] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<ProductoFormPayload>(VACIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [imagenesExistentes, setImagenesExistentes] = useState<ImagenProducto[]>([]);
  const [imagenesEliminadas, setImagenesEliminadas] = useState<number[]>([]);
  const [imagenesNuevas, setImagenesNuevas] = useState<File[]>([]);
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
  useEffect(() => {
    obtenerObjetivos(token).then(({ goals }) => setObjetivos(goals)).catch(() => {});
    obtenerCategorias().then(({ categorias }) => setCategoriasDisponibles(categorias)).catch(() => {});
  }, [token]);

  function toggleObjetivo(key: string) {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(key) ? f.goals.filter((g) => g !== key) : [...f.goals, key],
    }));
  }

  const totalImagenes = imagenesExistentes.filter((img) => !imagenesEliminadas.includes(img.id)).length + imagenesNuevas.length;

  function handleSeleccionarImagenes(files: FileList | null) {
    if (!files) return;
    const nuevas = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const espacioDisponible = MAX_IMAGENES - totalImagenes;
    if (espacioDisponible <= 0) {
      setError(`Ya tienes el máximo de ${MAX_IMAGENES} imágenes.`);
      return;
    }
    setImagenesNuevas((prev) => [...prev, ...nuevas.slice(0, espacioDisponible)]);
  }

  function quitarImagenExistente(id: number) {
    setImagenesEliminadas((prev) => [...prev, id]);
  }

  function quitarImagenNueva(index: number) {
    setImagenesNuevas((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setGuardando(true);

    try {
      const payload: ProductoFormPayload = { ...form, imagenesNuevas, eliminarImagenIds: imagenesEliminadas };
      if (editandoId) {
        await editarProducto(token, editandoId, payload);
      } else {
        await crearProducto(token, payload);
      }
      cerrarForm();
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
    setImagenesExistentes(p.images);
    setImagenesEliminadas([]);
    setImagenesNuevas([]);
    setMostrarForm(true);
  }

  function nuevo() {
    setEditandoId(null);
    setForm(VACIO);
    setImagenesExistentes([]);
    setImagenesEliminadas([]);
    setImagenesNuevas([]);
    setMostrarForm(true);
  }

  function cerrarForm() {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(VACIO);
    setImagenesExistentes([]);
    setImagenesEliminadas([]);
    setImagenesNuevas([]);
  }

  async function eliminar(id: number) {
    if (!token) return;
    setError(null);
    try {
      await eliminarProducto(token, id);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el producto.");
    }
  }

  const productosFiltrados = productos.filter((p) => {
    if (goalFiltro && !p.goals.includes(goalFiltro)) return false;
    if (catFiltro && p.cat !== catFiltro) return false;
    return true;
  });

  return (
    <main className="wide">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span className="eyebrow">Suplementos ABOFIT</span>
          <h1>Suplementos</h1>
        </div>
        <button type="button" onClick={nuevo}>+ Nuevo producto</button>
      </div>

      <span className="section-label">Filtra por objetivo</span>
      <div className="pill-group" style={{ marginBottom: 16 }}>
        <button type="button" className={`pill ${goalFiltro === "" ? "active" : ""}`} onClick={() => setGoalFiltro("")}>
          Todos los objetivos
        </button>
        {objetivos.map((o) => (
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

      {error && !mostrarForm && <p role="alert">{error}</p>}

      {mostrarForm && (
        <div className="modal-overlay" onClick={cerrarForm}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={cerrarForm}>×</button>
          <h3>{editandoId ? "Editar producto" : "Nuevo producto"}</h3>
          <form onSubmit={handleSubmit}>
            <label>Imágenes (máximo {MAX_IMAGENES}, se comprimen automáticamente a 3MB)</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {imagenesExistentes.filter((img) => !imagenesEliminadas.includes(img.id)).map((img) => (
                <div key={img.id} style={{ position: "relative" }}>
                  <img src={`${API_URL}${img.path}`} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
                  <button
                    type="button"
                    onClick={() => quitarImagenExistente(img.id)}
                    style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, padding: 0, borderRadius: "50%", fontSize: 12, lineHeight: "20px" }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {imagenesNuevas.map((file, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={URL.createObjectURL(file)} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
                  <button
                    type="button"
                    onClick={() => quitarImagenNueva(i)}
                    style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, padding: 0, borderRadius: "50%", fontSize: 12, lineHeight: "20px" }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {totalImagenes < MAX_IMAGENES && (
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => handleSeleccionarImagenes(e.target.files)} />
            )}

            <label>Categoría</label>
            <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })} required>
              <option value="" disabled>Elegir categoría</option>
              {categoriasDisponibles.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <label>Nombre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <label>Precio (RD$)</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
            <label>Existencias</label>
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required />

            <label>Objetivos</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {objetivos.map((o) => (
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

            {error && <p role="alert">{error}</p>}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" disabled={guardando}>{editandoId ? "Guardar cambios" : "Crear producto"}</button>
              <button type="button" className="secondary" onClick={cerrarForm}>Cancelar</button>
            </div>
          </form>
        </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {productosFiltrados.map((p) => (
          <div key={p.id} className="product-card">
            <div className="product-image" style={p.images[0] ? { backgroundImage: `url(${API_URL}${p.images[0].path})` } : undefined}>
              {!p.images[0] && p.cat}
              {p.images.length > 1 && (
                <span style={{ position: "absolute", bottom: 7, right: 8, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20 }}>
                  +{p.images.length - 1}
                </span>
              )}
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
