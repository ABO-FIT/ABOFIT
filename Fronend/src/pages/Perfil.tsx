import { useEffect, useState, type FormEvent } from "react";
import {
  actualizarPerfil,
  cambiarPassword,
  obtenerGimnasios,
  obtenerPerfil,
  type ActualizarPerfilPayload,
  type Gimnasio,
  type Perfil as PerfilType,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/brand/logo-onlight.png";

export default function Perfil() {
  const { token, usuario, cerrarSesion } = useAuth();

  const [form, setForm] = useState<ActualizarPerfilPayload | null>(null);
  const [gymId, setGymId] = useState<number | "">("");
  const [gimnasios, setGimnasios] = useState<Gimnasio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [mensajePassword, setMensajePassword] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  useEffect(() => {
    if (!token) return;

    obtenerPerfil(token)
      .then(({ usuario: perfil }: { usuario: PerfilType }) => {
        setForm({
          nombre: perfil.nombre,
          apellido: perfil.apellido,
          correo: perfil.correo,
          telefono: perfil.telefono ?? "",
          especialidad: perfil.especialidad ?? "",
          bio: perfil.bio ?? "",
          bankName: perfil.bank_name ?? "",
          bankAccount: perfil.bank_account ?? "",
          bankHolder: perfil.bank_holder ?? "",
          payPhone: perfil.pay_phone ?? "",
        });
        setGymId(perfil.gym_id ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el perfil."))
      .finally(() => setCargando(false));

    if (usuario?.rol === "Entrenador") {
      obtenerGimnasios(token).then(({ gimnasios }) => setGimnasios(gimnasios)).catch(() => {});
    }
  }, [token, usuario?.rol]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || !form) return;

    setError(null);
    setMensaje(null);
    setGuardando(true);

    try {
      const respuesta = await actualizarPerfil(token, { ...form, gymId: gymId === "" ? undefined : gymId });
      setMensaje(respuesta.message);
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

  if (cargando || !form) {
    return (
      <main>
        <p>Cargando perfil...</p>
      </main>
    );
  }

  const esEntrenador = usuario?.rol === "Entrenador";

  return (
    <main className="wide">
      <div className="brand">
        <img src={logo} alt="ABOFIT" />
      </div>
      <h1>Mi perfil</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />

        <label htmlFor="apellido">Apellido</label>
        <input
          id="apellido"
          value={form.apellido}
          onChange={(e) => setForm({ ...form, apellido: e.target.value })}
          required
        />

        <label htmlFor="correo">Correo electrónico</label>
        <input
          id="correo"
          type="email"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
          required
        />

        <label htmlFor="telefono">Teléfono</label>
        <input
          id="telefono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          required
        />

        {esEntrenador && (
          <>
            <label htmlFor="especialidad">Especialidad</label>
            <input
              id="especialidad"
              value={form.especialidad}
              onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
            />

            <label htmlFor="bio">Biografía</label>
            <textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />

            <label htmlFor="gymId">Gimnasio donde impartes tus entrenamientos</label>
            <select id="gymId" value={gymId} onChange={(e) => setGymId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Sin asignar</option>
              {gimnasios.map((g) => (
                <option key={g.id} value={g.id}>{g.name} — {g.city}</option>
              ))}
            </select>

            <h3>Datos bancarios para recibir pagos</h3>

            <label htmlFor="bankName">Banco</label>
            <input
              id="bankName"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            />

            <label htmlFor="bankAccount">Número de cuenta</label>
            <input
              id="bankAccount"
              value={form.bankAccount}
              onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
            />

            <label htmlFor="bankHolder">Titular de la cuenta</label>
            <input
              id="bankHolder"
              value={form.bankHolder}
              onChange={(e) => setForm({ ...form, bankHolder: e.target.value })}
            />

            <label htmlFor="payPhone">Teléfono para pagos móviles</label>
            <input
              id="payPhone"
              value={form.payPhone}
              onChange={(e) => setForm({ ...form, payPhone: e.target.value })}
            />
          </>
        )}

        <button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}

      <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid var(--line)" }} />

      <h2>Cambiar contraseña</h2>
      <form onSubmit={handleCambiarPassword}>
        <label htmlFor="passwordActual">Contraseña actual</label>
        <input
          id="passwordActual"
          type="password"
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
          required
        />

        <label htmlFor="passwordNueva">Contraseña nueva</label>
        <input
          id="passwordNueva"
          type="password"
          minLength={8}
          value={passwordNueva}
          onChange={(e) => setPasswordNueva(e.target.value)}
          required
        />

        <button type="submit" disabled={cambiandoPassword}>
          {cambiandoPassword ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>

      {mensajePassword && <p role="status">{mensajePassword}</p>}
      {errorPassword && <p role="alert">{errorPassword}</p>}

      <button type="button" className="secondary" style={{ marginTop: 24 }} onClick={cerrarSesion}>
        Cerrar sesión
      </button>
    </main>
  );
}
