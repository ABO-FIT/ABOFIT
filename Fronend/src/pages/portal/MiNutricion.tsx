import { useEffect, useState, type FormEvent } from "react";
import { eliminarRegistroNutricion, obtenerNutricion, registrarNutricion, type RegistroNutricion } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const TIPOS = [
  { key: "desayuno", label: "Desayuno" },
  { key: "almuerzo", label: "Almuerzo" },
  { key: "cena", label: "Cena" },
  { key: "snack", label: "Snack" },
];

export default function MiNutricion() {
  const { token } = useAuth();
  const [registros, setRegistros] = useState<RegistroNutricion[]>([]);
  const [tipo, setTipo] = useState("desayuno");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    if (!token) return;
    obtenerNutricion(token)
      .then(({ registros }) => setRegistros(registros))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar tu diario."));
  }

  useEffect(cargar, [token]);

  async function handleAgregar(event: FormEvent) {
    event.preventDefault();
    if (!token || !descripcion.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      await registrarNutricion(token, tipo, descripcion.trim());
      setDescripcion("");
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id: number) {
    if (!token) return;
    setError(null);
    try {
      await eliminarRegistroNutricion(token, id);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el registro.");
    }
  }

  return (
    <main className="wide">
      <span className="eyebrow">Diario alimenticio</span>
      <h1>Mi nutrición</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 8px" }}>Registrar comida</h2>
        <form onSubmit={handleAgregar}>
          <label htmlFor="tipo">Tipo</label>
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>

          <label htmlFor="descripcion">¿Qué comiste?</label>
          <input id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. Pechuga de pollo con arroz y ensalada" required />

          <button type="submit" disabled={guardando} style={{ marginTop: 8 }}>
            {guardando ? "Guardando..." : "Agregar"}
          </button>
        </form>
        {error && <p role="alert">{error}</p>}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {registros.map((registro) => (
          <div key={registro.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span className="tag">{TIPOS.find((t) => t.key === registro.tipo)?.label ?? registro.tipo}</span>
              <p style={{ margin: "6px 0 0" }}>{registro.descripcion}</p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{registro.fecha}</p>
            </div>
            <button type="button" className="secondary" onClick={() => handleEliminar(registro.id)}>Eliminar</button>
          </div>
        ))}
        {registros.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no has registrado comidas.</p>}
      </div>
    </main>
  );
}
