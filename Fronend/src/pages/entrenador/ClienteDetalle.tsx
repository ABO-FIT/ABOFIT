import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  cambiarObjetivoCliente,
  cambiarPlanCliente,
  guardarEvaluacion,
  obtenerDetalleCliente,
  obtenerObjetivos,
  type DetalleClienteRespuesta,
  type EvaluacionPayload,
  type GoalAdmin,
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

  const [evaluacion, setEvaluacion] = useState<EvaluacionPayload>({});
  const [mensajeEval, setMensajeEval] = useState<string | null>(null);
  const [guardandoEval, setGuardandoEval] = useState(false);

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
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el cliente."));
  }

  useEffect(cargar, [token, clientId]);
  useEffect(() => {
    obtenerObjetivos(token).then(({ goals }) => setObjetivos(goals)).catch(() => {});
  }, [token]);

  async function handleGuardarEvaluacion() {
    if (!token) return;
    setGuardandoEval(true);
    setMensajeEval(null);
    try {
      const respuesta = await guardarEvaluacion(token, clientId, evaluacion);
      setMensajeEval(respuesta.message);
      cargar();
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
            <option value="A">Plan A</option>
            <option value="B">Plan B</option>
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
          </div>

          <button type="button" onClick={handleGuardarEvaluacion} disabled={guardandoEval} style={{ marginTop: 16 }}>
            {guardandoEval ? "Guardando..." : "Guardar evaluación"}
          </button>
          {mensajeEval && <p role="status">{mensajeEval}</p>}

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
            </div>
            <div className="card">
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Proteína objetivo</p>
              <p style={{ margin: 0, fontWeight: 700 }}>{salud.proteinaObjetivoG ? `${salud.proteinaObjetivoG} g` : "—"}</p>
            </div>
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
        </div>
      )}
    </main>
  );
}
