import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  cambiarObjetivoCliente,
  cambiarPlanCliente,
  guardarEvaluacion,
  obtenerDetalleCliente,
  obtenerHistorialEvaluaciones,
  obtenerNutricionCliente,
  obtenerObjetivos,
  obtenerPlanes,
  type AdherenciaDieta,
  type DetalleClienteRespuesta,
  type EvaluacionHistorial,
  type EvaluacionPayload,
  type GoalAdmin,
  type PlanAdmin,
  type RegistroNutricion,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import RutinaBuilder from "./RutinaBuilder";
import DietaBuilder from "./DietaBuilder";
import PagosTab from "./PagosTab";

const NIVELES_ACTIVIDAD = [
  { key: "sedentario", label: "Sedentario" },
  { key: "ligero", label: "Ligero" },
  { key: "moderado", label: "Moderado" },
  { key: "activo", label: "Activo" },
  { key: "muy_activo", label: "Muy activo" },
];

const TABS = ["evaluacion", "rutina", "nutricion", "seguimiento", "pagos"] as const;
type Tab = (typeof TABS)[number];

export default function ClienteDetalle() {
  const { id } = useParams();
  const clientId = Number(id);
  const { token } = useAuth();

  const [tab, setTab] = useState<Tab>("evaluacion");
  const [datos, setDatos] = useState<DetalleClienteRespuesta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [objetivos, setObjetivos] = useState<GoalAdmin[]>([]);
  const [planes, setPlanes] = useState<PlanAdmin[]>([]);

  const [evaluacion, setEvaluacion] = useState<EvaluacionPayload>({});
  const [mensajeEval, setMensajeEval] = useState<string | null>(null);
  const [guardandoEval, setGuardandoEval] = useState(false);
  const [historialEval, setHistorialEval] = useState<EvaluacionHistorial[]>([]);

  function cargarHistorialEvaluaciones() {
    if (!token) return;
    obtenerHistorialEvaluaciones(token, clientId).then(({ historial }) => setHistorialEval(historial)).catch(() => {});
  }

  useEffect(cargarHistorialEvaluaciones, [token, clientId]);

  const [diarioNutricion, setDiarioNutricion] = useState<RegistroNutricion[]>([]);
  const [adherenciaPlan, setAdherenciaPlan] = useState<AdherenciaDieta | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerNutricionCliente(token, clientId)
      .then(({ diario, adherenciaPlan }) => {
        setDiarioNutricion(diario);
        setAdherenciaPlan(adherenciaPlan);
      })
      .catch(() => {});
  }, [token, clientId]);

  function cargar() {
    if (!token) return;
    obtenerDetalleCliente(token, clientId)
      .then((respuesta) => {
        setDatos(respuesta);
        setEvaluacion({
          peso: respuesta.cliente.peso ? Number(respuesta.cliente.peso) : undefined,
          pesoUnidad: respuesta.cliente.pesoUnidad,
          altura: respuesta.cliente.altura ? Number(respuesta.cliente.altura) : undefined,
          alturaUnidad: respuesta.cliente.alturaUnidad,
          edad: respuesta.cliente.edad ?? undefined,
          sexo: respuesta.cliente.sexo ?? undefined,
          nivelActividad: respuesta.cliente.nivelActividad ?? undefined,
          cintura: respuesta.cliente.cintura ? Number(respuesta.cliente.cintura) : undefined,
          cadera: respuesta.cliente.cadera ? Number(respuesta.cliente.cadera) : undefined,
          presionSistolica: respuesta.cliente.presionSistolica ?? undefined,
          presionDiastolica: respuesta.cliente.presionDiastolica ?? undefined,
          porcentajeGrasa: respuesta.cliente.porcentajeGrasa ? Number(respuesta.cliente.porcentajeGrasa) : undefined,
          porcentajeMasaMuscular: respuesta.cliente.porcentajeMasaMuscular ? Number(respuesta.cliente.porcentajeMasaMuscular) : undefined,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el cliente."));
  }

  useEffect(cargar, [token, clientId]);
  useEffect(() => {
    obtenerObjetivos(token).then(({ goals }) => setObjetivos(goals)).catch(() => {});
    if (!token) return;
    obtenerPlanes(token).then(({ planes }) => setPlanes(planes)).catch(() => {});
  }, [token]);

  async function handleGuardarEvaluacion() {
    if (!token) return;
    setGuardandoEval(true);
    setMensajeEval(null);
    try {
      const respuesta = await guardarEvaluacion(token, clientId, evaluacion);
      setMensajeEval(respuesta.message);
      cargar();
      cargarHistorialEvaluaciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardandoEval(false);
    }
  }

  async function handleCambiarObjetivo(goalKey: string) {
    if (!token) return;
    await cambiarObjetivoCliente(token, clientId, goalKey);
    cargar();
  }

  async function handleCambiarPlan(planKey: string) {
    if (!token) return;
    await cambiarPlanCliente(token, clientId, planKey);
    cargar();
  }

  if (error) {
    return (
      <main className="wide">
        <p role="alert">{error}</p>
      </main>
    );
  }

  if (!datos) {
    return (
      <main className="wide">
        <p>Cargando...</p>
      </main>
    );
  }

  const { cliente, salud, porcentajeSemana, progreso } = datos;

  return (
    <main className="wide">
      <h1>{cliente.nombre} {cliente.apellido}</h1>
      <p style={{ color: "var(--muted)" }}>@{cliente.usuario} · {cliente.correo} · {cliente.telefono}</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div>
          <label>Plan</label>
          <select value={cliente.planKey ?? ""} onChange={(e) => handleCambiarPlan(e.target.value)}>
            <option value="" disabled>Elegir plan</option>
            {planes.map((p) => (
              <option key={p.key} value={p.key}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Objetivo</label>
          <select value={cliente.goalKey ?? ""} onChange={(e) => handleCambiarObjetivo(e.target.value)}>
            <option value="" disabled>Elegir objetivo</option>
            {objetivos.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid var(--line)" }}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? "" : "secondary"}
            onClick={() => setTab(t)}
            style={{ borderRadius: "8px 8px 0 0" }}
          >
            {t === "evaluacion" && "Evaluación"}
            {t === "rutina" && "Rutina"}
            {t === "nutricion" && "Nutrición"}
            {t === "seguimiento" && "Seguimiento"}
            {t === "pagos" && "Pagos"}
          </button>
        ))}
      </div>

      {tab === "evaluacion" && (
        <div className="card">
          <h2>Evaluación de salud</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label>Peso</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" step="0.1" value={evaluacion.peso ?? ""} onChange={(e) => setEvaluacion({ ...evaluacion, peso: Number(e.target.value) })} />
                <select value={evaluacion.pesoUnidad ?? "kg"} onChange={(e) => setEvaluacion({ ...evaluacion, pesoUnidad: e.target.value as "kg" | "lb" })}>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>

            <div>
              <label>Altura</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" step="0.1" value={evaluacion.altura ?? ""} onChange={(e) => setEvaluacion({ ...evaluacion, altura: Number(e.target.value) })} />
                <select value={evaluacion.alturaUnidad ?? "cm"} onChange={(e) => setEvaluacion({ ...evaluacion, alturaUnidad: e.target.value as "cm" | "ft" })}>
                  <option value="cm">cm</option>
                  <option value="ft">ft</option>
                </select>
              </div>
            </div>

            <div>
              <label>Edad</label>
              <input type="number" value={evaluacion.edad ?? ""} onChange={(e) => setEvaluacion({ ...evaluacion, edad: Number(e.target.value) })} />
            </div>

            <div>
              <label>Sexo</label>
              <select value={evaluacion.sexo ?? ""} onChange={(e) => setEvaluacion({ ...evaluacion, sexo: e.target.value as "male" | "female" })}>
                <option value="" disabled>Elegir</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>

            <div>
              <label>Nivel de actividad</label>
              <select value={evaluacion.nivelActividad ?? ""} onChange={(e) => setEvaluacion({ ...evaluacion, nivelActividad: e.target.value })}>
                <option value="" disabled>Elegir</option>
                {NIVELES_ACTIVIDAD.map((n) => (
                  <option key={n.key} value={n.key}>{n.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Cintura (cm)</label>
              <input type="number" step="0.1" value={evaluacion.cintura ?? ""} onChange={(e) => setEvaluacion({ ...evaluacion, cintura: Number(e.target.value) })} />
            </div>

            <div>
              <label>Cadera (cm)</label>
              <input type="number" step="0.1" value={evaluacion.cadera ?? ""} onChange={(e) => setEvaluacion({ ...evaluacion, cadera: Number(e.target.value) })} />
            </div>

            <div>
              <label>Presión arterial</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" placeholder="Sistólica" value={evaluacion.presionSistolica ?? ""} onChange={(e) => setEvaluacion({ ...evaluacion, presionSistolica: Number(e.target.value) })} />
                <span>/</span>
                <input type="number" placeholder="Diastólica" value={evaluacion.presionDiastolica ?? ""} onChange={(e) => setEvaluacion({ ...evaluacion, presionDiastolica: Number(e.target.value) })} />
              </div>
            </div>

            <div>
              <label>% de grasa corporal</label>
              <input type="number" step="0.1" value={evaluacion.porcentajeGrasa ?? ""} onChange={(e) => setEvaluacion({ ...evaluacion, porcentajeGrasa: Number(e.target.value) })} />
            </div>

            <div>
              <label>% de masa muscular</label>
              <input type="number" step="0.1" value={evaluacion.porcentajeMasaMuscular ?? ""} onChange={(e) => setEvaluacion({ ...evaluacion, porcentajeMasaMuscular: Number(e.target.value) })} />
            </div>
          </div>

          <button type="button" onClick={handleGuardarEvaluacion} disabled={guardandoEval} style={{ marginTop: 16 }}>
            {guardandoEval ? "Guardando..." : "Guardar evaluación"}
          </button>
          {mensajeEval && <p role="status">{mensajeEval}</p>}

          {salud.advertenciaObjetivo && (
            <div
              role="alert"
              className="card"
              style={{ marginTop: 12, background: "#fff7ed", borderColor: "#f2811c", color: "#9a5b12" }}
            >
              <strong>⚠ Objetivo vs. estado actual</strong>
              <p style={{ margin: "6px 0 0" }}>{salud.advertenciaObjetivo}</p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9a5b12" }}>
                Esta advertencia queda registrada en la auditoría del sistema cada vez que se guarda la evaluación.
              </p>
            </div>
          )}

          <h3 style={{ marginTop: 24 }}>Resultados</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <div className="card">
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>IMC</p>
              <p style={{ margin: 0, fontWeight: 700 }}>{salud.imc ?? "—"} {salud.imcClasificacion ? `(${salud.imcClasificacion})` : ""}</p>
            </div>
            <div className="card">
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>ICC</p>
              <p style={{ margin: 0, fontWeight: 700 }}>{salud.icc ?? "—"} {salud.iccClasificacion ? `(${salud.iccClasificacion})` : ""}</p>
            </div>
            <div className="card">
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Presión</p>
              <p style={{ margin: 0, fontWeight: 700 }}>{salud.presionClasificacion ?? "—"}</p>
            </div>
            <div className="card">
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Calorías objetivo</p>
              <p style={{ margin: 0, fontWeight: 700 }}>{salud.caloriasObjetivo ? `${salud.caloriasObjetivo} kcal` : "—"}</p>
              {salud.formulaCalorica && (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 11 }}>
                  {salud.formulaCalorica === "katch_mcardle" ? "Fórmula Katch-McArdle (usa % grasa)" : "Fórmula Mifflin-St Jeor"}
                </p>
              )}
            </div>
            <div className="card">
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Proteína objetivo</p>
              <p style={{ margin: 0, fontWeight: 700 }}>{salud.proteinaObjetivoG ? `${salud.proteinaObjetivoG} g` : "—"}</p>
            </div>
            <div className="card">
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Masa magra / grasa</p>
              <p style={{ margin: 0, fontWeight: 700 }}>
                {salud.masaMagraKg ? `${salud.masaMagraKg} kg magra` : "—"}
                {salud.masaGrasaKg ? ` / ${salud.masaGrasaKg} kg grasa` : ""}
              </p>
            </div>
          </div>

          <h3 style={{ marginTop: 24 }}>Historial de evaluaciones</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {historialEval.map((registro) => (
              <div key={registro.id} className="card">
                <strong>{new Date(registro.created_at).toLocaleDateString("es-DO")}</strong>
                <p style={{ margin: 0 }}>
                  {registro.peso ? `${registro.peso} ${registro.peso_unidad}` : ""}
                  {registro.cintura ? ` · Cintura ${registro.cintura} cm` : ""}
                  {registro.presion_sistolica && registro.presion_diastolica
                    ? ` · Presión ${registro.presion_sistolica}/${registro.presion_diastolica}`
                    : ""}
                  {registro.porcentaje_grasa ? ` · Grasa ${registro.porcentaje_grasa}%` : ""}
                  {registro.porcentaje_masa_muscular ? ` · Masa muscular ${registro.porcentaje_masa_muscular}%` : ""}
                </p>
              </div>
            ))}
            {historialEval.length === 0 && <p style={{ color: "var(--muted)" }}>Sin evaluaciones registradas todavía.</p>}
          </div>
        </div>
      )}

      {tab === "rutina" && <RutinaBuilder clientId={clientId} />}
      {tab === "nutricion" && <DietaBuilder clientId={clientId} />}
      {tab === "pagos" && <PagosTab clientId={clientId} />}

      {tab === "seguimiento" && (
        <div className="card">
          <h2>Cumplimiento de esta semana: {porcentajeSemana}%</h2>
          <h3>Historial de progreso</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {progreso.map((entrada) => (
              <div key={entrada.id} className="card">
                <strong>{entrada.fecha}</strong>
                <p style={{ margin: 0 }}>
                  {entrada.peso ? `${entrada.peso} kg` : ""} {entrada.cintura ? `· Cintura ${entrada.cintura} cm` : ""}
                </p>
                {entrada.nota && <p style={{ margin: 0, color: "var(--muted)" }}>{entrada.nota}</p>}
              </div>
            ))}
            {progreso.length === 0 && <p style={{ color: "var(--muted)" }}>Sin registros de progreso todavía.</p>}
          </div>

          {adherenciaPlan && adherenciaPlan.totalEsperadas > 0 && (
            <>
              <h3 style={{ marginTop: 24 }}>Adherencia al plan de alimentación (últimos 7 días)</h3>
              <div className="card">
                <strong>{adherenciaPlan.porcentaje}%</strong>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  {adherenciaPlan.completadas} de {adherenciaPlan.totalEsperadas} comidas marcadas como consumidas
                </p>
              </div>
            </>
          )}

          <h3 style={{ marginTop: 24 }}>Diario de comidas del cliente</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {diarioNutricion.map((registro) => (
              <div key={registro.id} className="card">
                <span className="tag">{registro.tipo}</span>
                <p style={{ margin: "6px 0 0" }}>{registro.descripcion}</p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{registro.fecha}</p>
              </div>
            ))}
            {diarioNutricion.length === 0 && <p style={{ color: "var(--muted)" }}>El cliente no ha registrado comidas por su cuenta.</p>}
          </div>
        </div>
      )}
    </main>
  );
}
