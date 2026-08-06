import { useEffect, useState, type FormEvent } from "react";
import {
  crearPlanEntrenador,
  editarPlanEntrenador,
  eliminarPlanEntrenador,
  obtenerPeriodicidades,
  obtenerPlanesEntrenador,
  type Periodicidad,
  type PlanAdmin,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

const VACIO = { name: "", price: 0, description: "", includesDiet: false, periodicidadKey: "mensual", beneficiosTexto: "" };

export default function PlanesEntrenador() {
  const { token } = useAuth();
  const [planes, setPlanes] = useState<PlanAdmin[]>([]);
  const [periodicidades, setPeriodicidades] = useState<Periodicidad[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [editando, setEditando] = useState<PlanAdmin | null>(null);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    if (!token) return;
    obtenerPlanesEntrenador(token)
      .then(({ planes }) => setPlanes(planes))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar tus planes."));
  }

  useEffect(cargar, [token]);
  useEffect(() => {
    obtenerPeriodicidades().then(({ periodicidades }) => setPeriodicidades(periodicidades)).catch(() => {});
  }, []);

  function abrirEditar(plan: PlanAdmin) {
    setEditando(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      description: plan.description,
      includesDiet: plan.includes_diet,
      periodicidadKey: plan.periodicidad_key,
      beneficiosTexto: (plan.beneficios ?? []).join("\n"),
    });
  }

  function abrirCrear() {
    setCreando(true);
    setForm(VACIO);
  }

  function cerrar() {
    setEditando(null);
    setCreando(false);
    setForm(VACIO);
  }

  async function handleGuardar(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setGuardando(true);

    const beneficios = form.beneficiosTexto
      .split("\n")
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 0);
    const payload = { ...form, beneficios };

    try {
      if (editando) {
        await editarPlanEntrenador(token, editando.key, payload);
      } else {
        await crearPlanEntrenador(token, payload);
      }
      cerrar();
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(key: string, name: string) {
    if (!token) return;
    if (!window.confirm(`¿Eliminar "${name}"?`)) return;
    setError(null);
    try {
      await eliminarPlanEntrenador(token, key);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  const modalAbierto = editando !== null || creando;

  return (
    <main className="wide">
      <div className="page-h">
        <div>
          <span className="eyebrow">Mis servicios</span>
          <h1>Mis Planes</h1>
        </div>
        <button type="button" onClick={abrirCrear}>+ Nuevo plan</button>
      </div>

      <p style={{ color: "var(--muted)", marginTop: -8 }}>
        Define tus propios planes, precios y periodicidad de cobro. Estos planes solo los ves tú y tus clientes.
      </p>

      {error && !modalAbierto && <p role="alert" style={{ marginTop: 12 }}>{error}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 16 }}>
        {planes.map((plan) => (
          <div key={plan.key} className="card" style={{ flex: "1 1 260px", minWidth: 260 }}>
            <h3 style={{ fontFamily: "var(--disp)", fontSize: 21, margin: "0 0 6px" }}>{plan.name}</h3>
            <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>{plan.description}</p>
            <div style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: 32, color: "var(--accent2)", marginTop: 14 }}>
              {money(plan.price)}
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
                {" "}/ {periodicidades.find((p) => p.key === plan.periodicidad_key)?.label.toLowerCase() ?? "mes"}
              </span>
            </div>
            {(plan.includes_diet || (plan.beneficios && plan.beneficios.length > 0)) && (
              <ul style={{ margin: "14px 0 0", paddingLeft: 18, color: "#3a4150", lineHeight: 1.9, fontSize: 14 }}>
                {!!plan.includes_diet && <li>Plan de alimentación incluido</li>}
                {plan.beneficios?.map((beneficio) => <li key={beneficio}>{beneficio}</li>)}
              </ul>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="button" className="secondary" onClick={() => abrirEditar(plan)}>Editar</button>
              <button type="button" className="secondary" style={{ color: "var(--accent2)" }} onClick={() => handleEliminar(plan.key, plan.name)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {planes.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no has creado ningún plan.</p>}
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrar}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" aria-label="Cerrar" onClick={cerrar}>×</button>
            <h3 style={{ fontFamily: "var(--disp)", textTransform: "uppercase", margin: "0 0 10px" }}>
              {editando ? "Editar plan" : "Nuevo plan"}
            </h3>
            <form onSubmit={handleGuardar}>
              <label>Nombre del plan</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Plan Premium"
                required
              />

              <label>Precio (RD$)</label>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                required
              />

              <label>Periodicidad de cobro</label>
              <select value={form.periodicidadKey} onChange={(e) => setForm({ ...form, periodicidadKey: e.target.value })}>
                {periodicidades.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>

              <label>Descripción</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe qué incluye este plan"
                required
              />

              <label>Beneficios (uno por línea)</label>
              <textarea
                value={form.beneficiosTexto}
                onChange={(e) => setForm({ ...form, beneficiosTexto: e.target.value })}
                placeholder={"Rutina personalizada con seguimiento\nContacto directo con tu entrenador\nEvaluación mensual de progreso"}
                rows={4}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  id="incluye-dieta"
                  checked={form.includesDiet}
                  onChange={(e) => setForm({ ...form, includesDiet: e.target.checked })}
                />
                <label htmlFor="incluye-dieta" style={{ margin: 0, cursor: "pointer" }}>Incluye plan de alimentación</label>
              </div>

              {error && <p role="alert">{error}</p>}

              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button type="button" className="secondary" onClick={cerrar}>Cancelar</button>
                <button type="submit" disabled={guardando}>{editando ? "Guardar" : "Crear plan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
