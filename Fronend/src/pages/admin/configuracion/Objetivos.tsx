import { useEffect, useState, type FormEvent } from "react";
import {
  crearObjetivo,
  editarObjetivo,
  eliminarObjetivo,
  obtenerObjetivosAdmin,
  type GoalAdmin,
} from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

const OBJETIVO_VACIO = { key: "", label: "", shortLabel: "", color: "#f2811c" };

export default function ConfigObjetivos() {
  const { token } = useAuth();

  const [objetivos, setObjetivos] = useState<GoalAdmin[]>([]);
  const [formObjetivo, setFormObjetivo] = useState(OBJETIVO_VACIO);
  const [editandoObjetivo, setEditandoObjetivo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function cargar() {
    if (!token) return;
    obtenerObjetivosAdmin(token).then(({ goals }) => setObjetivos(goals)).catch(() => {});
  }

  useEffect(cargar, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);

    try {
      if (editandoObjetivo) {
        await editarObjetivo(token, editandoObjetivo, formObjetivo);
      } else {
        await crearObjetivo(token, formObjetivo);
      }
      setFormObjetivo(OBJETIVO_VACIO);
      setEditandoObjetivo(null);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  function editarForm(g: GoalAdmin) {
    setEditandoObjetivo(g.key);
    setFormObjetivo({ key: g.key, label: g.label, shortLabel: g.short_label, color: g.color });
  }

  async function eliminarClick(key: string) {
    if (!token) return;
    setError(null);
    try {
      await eliminarObjetivo(token, key);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  return (
    <main className="wide">
      <span className="eyebrow">Configuración</span>
      <h1>Objetivos</h1>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-3">
            <div>
              <label>Clave</label>
              <input
                value={formObjetivo.key}
                onChange={(e) => setFormObjetivo({ ...formObjetivo, key: e.target.value })}
                disabled={!!editandoObjetivo}
                placeholder="ej. resistencia"
                required
              />
            </div>
            <div>
              <label>Nombre</label>
              <input value={formObjetivo.label} onChange={(e) => setFormObjetivo({ ...formObjetivo, label: e.target.value })} required />
            </div>
            <div>
              <label>Nombre corto</label>
              <input value={formObjetivo.shortLabel} onChange={(e) => setFormObjetivo({ ...formObjetivo, shortLabel: e.target.value })} required />
            </div>
            <div>
              <label>Color</label>
              <input type="color" value={formObjetivo.color} onChange={(e) => setFormObjetivo({ ...formObjetivo, color: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit">{editandoObjetivo ? "Guardar cambios" : "Crear objetivo"}</button>
            {editandoObjetivo && (
              <button type="button" className="secondary" onClick={() => { setEditandoObjetivo(null); setFormObjetivo(OBJETIVO_VACIO); }}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        {error && <p role="alert" style={{ marginTop: 8 }}>{error}</p>}

        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          {objetivos.map((g) => (
            <div key={g.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: g.color, display: "inline-block" }} />
                <strong>{g.label}</strong>
                <span className="tag">{g.short_label}</span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>({g.key})</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="secondary" onClick={() => editarForm(g)}>Editar</button>
                <button type="button" className="secondary" onClick={() => eliminarClick(g.key)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
