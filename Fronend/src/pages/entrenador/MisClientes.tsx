import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  asignarCliente,
  buscarCliente,
  crearClienteDirecto,
  obtenerMisClientes,
  obtenerObjetivos,
  obtenerPlanes,
  type ClienteBuscado,
  type ClienteResumen,
  type GoalAdmin,
  type NuevoClientePayload,
  type PlanAdmin,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const NUEVO_CLIENTE_INICIAL: NuevoClientePayload = {
  nombre: "",
  apellido: "",
  correo: "",
  usuario: "",
  telefono: "",
  planKey: "",
  goalKey: "",
};

export default function MisClientes() {
  const { token } = useAuth();
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [objetivos, setObjetivos] = useState<GoalAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [filtroGoal, setFiltroGoal] = useState("");

  const [mostrarBuscar, setMostrarBuscar] = useState(false);
  const [usuarioBuscado, setUsuarioBuscado] = useState("");
  const [encontrado, setEncontrado] = useState<ClienteBuscado | null>(null);
  const [planes, setPlanes] = useState<PlanAdmin[]>([]);
  const [planAsignar, setPlanAsignar] = useState("");
  const [goalAsignar, setGoalAsignar] = useState("");
  const [errorBuscar, setErrorBuscar] = useState<string | null>(null);

  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState<NuevoClientePayload>(NUEVO_CLIENTE_INICIAL);
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);
  const [mensajeNuevo, setMensajeNuevo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    if (!token) return;
    obtenerMisClientes(token)
      .then(({ clientes }) => setClientes(clientes))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar tus clientes."));
  }

  useEffect(cargar, [token]);
  useEffect(() => {
    obtenerObjetivos(token).then(({ goals }) => {
      setObjetivos(goals);
      if (goals.length > 0) {
        setGoalAsignar((actual) => actual || goals[0].key);
        setNuevoCliente((n) => ({ ...n, goalKey: n.goalKey || goals[0].key }));
      }
    }).catch(() => {});
    obtenerPlanes().then(({ planes }) => {
      setPlanes(planes);
      if (planes.length > 0) {
        setPlanAsignar((actual) => actual || planes[0].key);
        setNuevoCliente((n) => ({ ...n, planKey: n.planKey || planes[0].key }));
      }
    }).catch(() => {});
  }, [token]);

  async function handleBuscar(event: FormEvent) {
    event.preventDefault();
    if (!token || !usuarioBuscado.trim()) return;

    setErrorBuscar(null);
    setEncontrado(null);

    try {
      const respuesta = await buscarCliente(token, usuarioBuscado.trim());
      setEncontrado(respuesta.cliente);
    } catch (err) {
      setErrorBuscar(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function handleAsignar() {
    if (!token || !encontrado) return;
    setGuardando(true);
    try {
      await asignarCliente(token, encontrado.usuario, planAsignar, goalAsignar);
      setEncontrado(null);
      setUsuarioBuscado("");
      setMostrarBuscar(false);
      cargar();
    } catch (err) {
      setErrorBuscar(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleCrearNuevo(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setErrorNuevo(null);
    setMensajeNuevo(null);
    setGuardando(true);

    try {
      const respuesta = await crearClienteDirecto(token, nuevoCliente);
      setMensajeNuevo(respuesta.message);
      setNuevoCliente(NUEVO_CLIENTE_INICIAL);
      cargar();
    } catch (err) {
      setErrorNuevo(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="wide">
      <h1>Mis Clientes</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => setMostrarBuscar((v) => !v)}>
          Agregar cliente existente
        </button>
        <button type="button" className="secondary" onClick={() => setMostrarNuevo((v) => !v)}>
          Crear cliente nuevo
        </button>
      </div>

      {mostrarBuscar && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Buscar cliente por usuario</h3>
          <form onSubmit={handleBuscar}>
            <label htmlFor="usuarioBuscado">Usuario</label>
            <input id="usuarioBuscado" value={usuarioBuscado} onChange={(e) => setUsuarioBuscado(e.target.value)} required />
            <button type="submit">Buscar</button>
          </form>

          {errorBuscar && <p role="alert">{errorBuscar}</p>}

          {encontrado && (
            <div style={{ marginTop: 12 }}>
              <p>
                <strong>{encontrado.nombre} {encontrado.apellido}</strong> (@{encontrado.usuario})
              </p>

              <label htmlFor="planAsignar">Plan</label>
              <select id="planAsignar" value={planAsignar} onChange={(e) => setPlanAsignar(e.target.value)}>
                {planes.map((p) => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>

              <label htmlFor="goalAsignar">Objetivo</label>
              <select id="goalAsignar" value={goalAsignar} onChange={(e) => setGoalAsignar(e.target.value)}>
                {objetivos.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>

              <button type="button" onClick={handleAsignar} disabled={guardando} style={{ marginTop: 8 }}>
                {guardando ? "Asignando..." : "Asignar a mi cartera"}
              </button>
            </div>
          )}
        </div>
      )}

      {mostrarNuevo && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Crear cliente nuevo</h3>
          <form onSubmit={handleCrearNuevo}>
            <label htmlFor="nombreNuevo">Nombre</label>
            <input id="nombreNuevo" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} required />

            <label htmlFor="apellidoNuevo">Apellido</label>
            <input id="apellidoNuevo" value={nuevoCliente.apellido} onChange={(e) => setNuevoCliente({ ...nuevoCliente, apellido: e.target.value })} required />

            <label htmlFor="correoNuevo">Correo</label>
            <input id="correoNuevo" type="email" value={nuevoCliente.correo} onChange={(e) => setNuevoCliente({ ...nuevoCliente, correo: e.target.value })} required />

            <label htmlFor="usuarioNuevo">Usuario</label>
            <input id="usuarioNuevo" value={nuevoCliente.usuario} onChange={(e) => setNuevoCliente({ ...nuevoCliente, usuario: e.target.value })} required />

            <label htmlFor="telefonoNuevo">Teléfono</label>
            <input id="telefonoNuevo" value={nuevoCliente.telefono} onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} required />

            <label htmlFor="planNuevo">Plan</label>
            <select id="planNuevo" value={nuevoCliente.planKey} onChange={(e) => setNuevoCliente({ ...nuevoCliente, planKey: e.target.value })}>
              {planes.map((p) => (
                <option key={p.key} value={p.key}>{p.name}</option>
              ))}
            </select>

            <label htmlFor="goalNuevo">Objetivo</label>
            <select id="goalNuevo" value={nuevoCliente.goalKey} onChange={(e) => setNuevoCliente({ ...nuevoCliente, goalKey: e.target.value })}>
              {objetivos.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>

            <button type="submit" disabled={guardando}>
              {guardando ? "Creando..." : "Crear cliente"}
            </button>
          </form>
          {mensajeNuevo && <p role="status">{mensajeNuevo}</p>}
          {errorNuevo && <p role="alert">{errorNuevo}</p>}
        </div>
      )}

      {error && <p role="alert">{error}</p>}

      {objetivos.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="filtroGoal">Filtrar por objetivo</label>
          <select id="filtroGoal" value={filtroGoal} onChange={(e) => setFiltroGoal(e.target.value)}>
            <option value="">Todos</option>
            {objetivos.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {clientes
          .filter((cliente) => !filtroGoal || cliente.goal_key === filtroGoal)
          .map((cliente) => (
            <Link key={cliente.id} to={`/entrenador/clientes/${cliente.id}`} className="card" style={{ textDecoration: "none", color: "inherit", display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>{cliente.nombre} {cliente.apellido}</strong>
                <p style={{ margin: 0, color: "var(--muted)" }}>@{cliente.usuario} · {cliente.correo}</p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                  Rutina esta semana: {cliente.porcentajeSemana}% · Último progreso: {cliente.ultimaFechaProgreso ?? "sin registros"}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {cliente.plan_key && <span className="tag" style={{ background: "var(--oks)", color: "var(--ok)" }}>Plan {cliente.plan_key}</span>}
                {cliente.goal_key && <span className="tag" style={{ background: "var(--line)" }}>{cliente.goal_key}</span>}
              </div>
            </Link>
          ))}
        {clientes.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no tienes clientes asignados.</p>}
      </div>
    </main>
  );
}
