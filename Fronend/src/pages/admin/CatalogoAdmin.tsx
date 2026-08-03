import { useEffect, useState, type FormEvent } from "react";
import { crearProducto, editarProducto, eliminarProducto, obtenerProductosAdmin, type ProductoAdmin } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

const OBJETIVOS = ["masa", "grasa", "mantenimiento", "rendimiento"];
const VACIO = { cat: "", name: "", price: 0, stock: 0, goals: [] as string[] };

export default function CatalogoAdmin() {
  const { token } = useAuth();
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  function cargar() {
    if (!token) return;
    obtenerProductosAdmin(token)
      .then(({ productos }) => setProductos(productos))
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
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  function editar(p: ProductoAdmin) {
    setEditandoId(p.id);
    setForm({ cat: p.cat, name: p.name, price: p.price, stock: p.stock, goals: p.goals });
  }

  async function eliminar(id: number) {
    if (!token) return;
    await eliminarProducto(token, id);
    cargar();
  }

  return (
    <main className="wide">
      <h1>Catálogo (Administración)</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{editandoId ? "Editar producto" : "Nuevo producto"}</h3>
        <form onSubmit={handleSubmit}>
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
            {OBJETIVOS.map((o) => (
              <button
                key={o}
                type="button"
                className={form.goals.includes(o) ? "" : "secondary"}
                onClick={() => toggleObjetivo(o)}
              >
                {o}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit">{editandoId ? "Guardar cambios" : "Crear producto"}</button>
            {editandoId && (
              <button type="button" className="secondary" onClick={() => { setEditandoId(null); setForm(VACIO); }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <p role="alert">{error}</p>}

      <div style={{ display: "grid", gap: 8 }}>
        {productos.map((p) => (
          <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{p.name}</strong>
              <p style={{ margin: 0, color: "var(--muted)" }}>{p.cat} · {money(p.price)} · Stock: {p.stock}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="secondary" onClick={() => editar(p)}>Editar</button>
              <button type="button" className="secondary" onClick={() => eliminar(p.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
