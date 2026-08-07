import { useEffect, useState, type FormEvent } from "react";
import {
  actualizarPerfil,
  cambiarPassword,
  obtenerGimnasios,
  obtenerMiPlan,
  obtenerPerfil,
  type ActualizarPerfilPayload,
  type Gimnasio,
  type MiPlanRespuesta,
  type Perfil as PerfilType,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { money } from "../lib/money";

export default function Perfil() {
  const { token, usuario } = useAuth();

  const [perfil, setPerfil] = useState<PerfilType | null>(null);
  const [plan, setPlan] = useState<MiPlanRespuesta | null>(null);
  const [gimnasios, setGimnasios] = useState<Gimnasio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<ActualizarPerfilPayload | null>(null);
  const [gymId, setGymId] = useState<number | "">("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [mensajePassword, setMensajePassword] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const esEntrenador = usuario?.rol === "Entrenador";
  const esCliente = usuario?.rol === "Cliente";

  function formularioDesde(p: PerfilType): ActualizarPerfilPayload {
    return {
      nombre: p.nombre,
      apellido: p.apellido,
      correo: p.correo,
      telefono: p.telefono ?? "",
      especialidad: p.especialidad ?? "",
      bio: p.bio ?? "",
      bankName: p.bank_name ?? "",
      bankAccount: p.bank_account ?? "",
      bankHolder: p.bank_holder ?? "",
      payPhone: p.pay_phone ?? "",
    };
  }

  useEffect(() => {
    if (!token) return;

    obtenerPerfil(token)
      .then(({ usuario: p }) => {
        setPerfil(p);
        setForm(formularioDesde(p));
        setGymId(p.gym_id ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el perfil."))
      .finally(() => setCargando(false));

    if (usuario?.rol === "Cliente") {
      obtenerMiPlan(token).then(setPlan).catch(() => {});
    }

    if (usuario?.rol === "Entrenador") {
      obtenerGimnasios(token).then(({ gimnasios }) => setGimnasios(gimnasios)).catch(() => {});
    }
  }, [token, usuario?.rol]);

  function cancelarEdicion() {
    if (perfil) {
      setForm(formularioDesde(perfil));
      setGymId(perfil.gym_id ?? "");
    }
    setEdit(false);
  }

  async function handleGuardar(event: FormEvent) {
    event.preventDefault();
    if (!token || !form) return;

    setError(null);
    setMensaje(null);
    setGuardando(true);

    try {
      const respuesta = await actualizarPerfil(token, { ...form, gymId: gymId === "" ? undefined : gymId });
      setMensaje(respuesta.message);
      setEdit(false);
      const { usuario: p } = await obtenerPerfil(token);
      setPerfil(p);
      setForm(formularioDesde(p));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleCambiarPassword(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setErrorPassword(null);
    setMensajePassword(null);
    setCambiandoPassword(true);

    try {
      const respuesta = await cambiarPassword(token, passwordActual, passwordNueva);
      setMensajePassword(respuesta.message);
      setPasswordActual("");
      setPasswordNueva("");
    } catch (err) {
      setErrorPassword(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setCambiandoPassword(false);
    }
  }

  if (cargando || !perfil || !form) {
    return (
      <main className="wide">
        <p>Cargando perfil...</p>
      </main>
    );
  }

  const roleLabel = usuario?.rol ?? perfil.rol;
  const inicial = (perfil.nombre || "?").slice(0, 1).toUpperCase();
  const goal = esCliente && plan?.asignado ? plan.goal : null;
  const planInfo = esCliente && plan?.asignado ? plan.plan : null;

  return (
    <main className="wide">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ margin: 0 }}>Perfil</h1>
        {!edit ? (
          <button type="button" className="secondary" onClick={() => setEdit(true)}>Editar</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="secondary" onClick={cancelarEdicion}>Cancelar</button>
            <button type="submit" form="form-perfil" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}
      </div>

      {error && <p role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}

      <div className="card" style={{ display: "flex", gap: 18, alignItems: "center", padding: 18, marginTop: 16 }}>
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 26 }}>{inicial}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{perfil.nombre} {perfil.apellido}</div>
          <div style={{ color: "var(--muted)", marginTop: 4 }}>{perfil.correo}</div>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="tag">{roleLabel}</span>
            {esCliente && planInfo && (
              <span className={`tag ${planInfo.key === "B" ? "b" : "a"}`}>{planInfo.name}</span>
            )}
            {esCliente && goal && (
              <span className="tag" style={{ background: goal.color, color: "#fff" }}>{goal.shortLabel}</span>
            )}
          </div>
        </div>
      </div>

      <form id="form-perfil" onSubmit={handleGuardar}>
        <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Información personal</h3>
            {!edit ? (
              <table>
                <tbody>
                  <tr><td className="muted">Nombre</td><td>{perfil.nombre} {perfil.apellido}</td></tr>
                  <tr><td className="muted">Correo</td><td>{perfil.correo}</td></tr>
                  <tr><td className="muted">Teléfono</td><td>{perfil.telefono || <span className="muted">— no registrado —</span>}</td></tr>
                  <tr><td className="muted">Tipo de perfil</td><td>{roleLabel}</td></tr>
                  {esCliente && <tr><td className="muted">Inicio</td><td>{perfil.fecha_inicio || "—"}</td></tr>}
                </tbody>
              </table>
            ) : (
              <>
                <label htmlFor="nombre">Nombre</label>
                <input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />

                <label htmlFor="apellido">Apellido</label>
                <input id="apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required />

                <label htmlFor="correo">Correo</label>
                <input id="correo" type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required />

                <label htmlFor="telefono">Teléfono</label>
                <input id="telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="809-000-0000" required />
              </>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>{esCliente ? "Mi entrenamiento" : "Cuenta"}</h3>
            {esCliente ? (
              <table>
                <tbody>
                  <tr><td className="muted">Plan</td><td>{planInfo?.name ?? "—"}</td></tr>
                  <tr><td className="muted">Precio</td><td>{planInfo ? money(planInfo.price) : "—"}</td></tr>
                  <tr><td className="muted">Objetivo</td><td>{goal?.label ?? "—"}</td></tr>
                  <tr><td className="muted">Incluye dieta</td><td>{planInfo?.includesDiet ? "Sí" : "No"}</td></tr>
                </tbody>
              </table>
            ) : (
              <table>
                <tbody>
                  <tr><td className="muted">Rol</td><td>{roleLabel}</td></tr>
                  <tr><td className="muted">Usuario</td><td>{perfil.usuario || "—"}</td></tr>
                  <tr><td className="muted">Correo</td><td>{perfil.correo}</td></tr>
                  <tr><td className="muted">ID</td><td>{perfil.id}</td></tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        {esEntrenador && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Información profesional</h3>
            {!edit ? (
              <table>
                <tbody>
                  <tr><td className="muted">Especialidad</td><td>{perfil.especialidad || "—"}</td></tr>
                  <tr><td className="muted">Biografía</td><td>{perfil.bio || "—"}</td></tr>
                  <tr><td className="muted">Gimnasio</td><td>{gimnasios.find((g) => g.id === perfil.gym_id)?.name || "— no registrado —"}</td></tr>
                </tbody>
              </table>
            ) : (
              <>
                <label htmlFor="especialidad">Especialidad</label>
                <input id="especialidad" value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} />

                <label htmlFor="bio">Biografía</label>
                <textarea id="bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />

                <label htmlFor="gymId">Gimnasio donde impartes tus entrenamientos</label>
                <select id="gymId" value={gymId} onChange={(e) => setGymId(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">Sin asignar</option>
                  {gimnasios.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} — {g.city}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        )}

        {esEntrenador && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Métodos de pago</h3>
            {!edit ? (
              <table>
                <tbody>
                  <tr><td className="muted">Banco</td><td>{perfil.bank_name || <span className="muted">— no registrado —</span>}</td></tr>
                  <tr><td className="muted">Número de cuenta</td><td>{perfil.bank_account || "—"}</td></tr>
                  <tr><td className="muted">Titular</td><td>{perfil.bank_holder || "—"}</td></tr>
                  <tr><td className="muted">Tel. de pago</td><td>{perfil.pay_phone || "—"}</td></tr>
                </tbody>
              </table>
            ) : (
              <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <div>
                  <label htmlFor="bankName">Banco</label>
                  <input id="bankName" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Banco Popular, BHD…" />
                </div>
                <div>
                  <label htmlFor="bankAccount">Número de cuenta</label>
                  <input id="bankAccount" value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} placeholder="000-000000-0" />
                </div>
                <div>
                  <label htmlFor="bankHolder">Titular</label>
                  <input id="bankHolder" value={form.bankHolder} onChange={(e) => setForm({ ...form, bankHolder: e.target.value })} placeholder="Nombre del titular" />
                </div>
                <div>
                  <label htmlFor="payPhone">Teléfono para transferencia</label>
                  <input id="payPhone" value={form.payPhone} onChange={(e) => setForm({ ...form, payPhone: e.target.value })} placeholder="829-000-0000" />
                </div>
              </div>
            )}
          </div>
        )}
      </form>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Cambiar contraseña</h3>
        <form onSubmit={handleCambiarPassword}>
          <label htmlFor="passwordActual">Contraseña actual</label>
          <input id="passwordActual" type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} required />

          <label htmlFor="passwordNueva">Contraseña nueva</label>
          <input id="passwordNueva" type="password" minLength={8} value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} required />

          <button type="submit" disabled={cambiandoPassword}>
            {cambiandoPassword ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
        {mensajePassword && <p role="status">{mensajePassword}</p>}
        {errorPassword && <p role="alert">{errorPassword}</p>}
      </div>
    </main>
  );
}
