import { useEffect, useState, type FormEvent } from "react";
import {
  crearCategoria,
  editarCategoria,
  eliminarCategoria,
  obtenerCategoriasAdmin,
  type CategoriaAdmin,
} from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

export default function ConfigCategorias() {
  const { token } = useAuth();

  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [editandoCategoria, setEditandoCategoria] = useState<{ id: number; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function cargar() {
    if (!token) return;
    obtenerCategoriasAdmin(token).then(({ categorias }) => setCategorias(categorias)).catch(() => {});
  }

  useEffect(cargar, [token]);

  async function handleCrear(event: FormEvent) {
    event.preventDefault();
    if (!token || !nuevaCategoria.trim()) return;
    setError(null);
    try {
      await crearCategoria(token, nuevaCategoria.trim());
      setNuevaCategoria("");
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function handleGuardar() {
    if (!token || !editandoCategoria) return;
    setError(null);
    try {
      await editarCategoria(token, editandoCategoria.id, editandoCategoria.name);
      setEditandoCategoria(null);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function eliminarClick(id: number) {
    if (!token) return;
    setError(null);
    try {
      await eliminarCategoria(token, id);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  return (
    <main className="wide">
      <span className="eyebrow">Configuración</span>
      <h1>Categoría de catálogo</h1>

      <div className="card">
        <form onSubmit={handleCrear} style={{ flexDirection: "row" }}>
          <input placeholder="Nueva categoría" value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} style={{ flex: 1 }} />
          <button type="submit">Agregar</button>
        </form>

        {error && <p role="alert" style={{ marginTop: 8 }}>{error}</p>}

        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          {categorias.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              {editandoCategoria?.id === c.id ? (
                <input
                  value={editandoCategoria.name}
                  onChange={(e) => setEditandoCategoria({ ...editandoCategoria, name: e.target.value })}
                  style={{ flex: 1, marginRight: 8 }}
                />
              ) : (
                <strong>{c.name}</strong>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                {editandoCategoria?.id === c.id ? (
                  <>
                    <button type="button" onClick={handleGuardar}>Guardar</button>
                    <button type="button" className="secondary" onClick={() => setEditandoCategoria(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="secondary" onClick={() => setEditandoCategoria({ id: c.id, name: c.name })}>Editar</button>
                    <button type="button" className="secondary" onClick={() => eliminarClick(c.id)}>Eliminar</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
