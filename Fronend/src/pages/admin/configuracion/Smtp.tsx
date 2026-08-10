import { useEffect, useState, type FormEvent } from "react";
import { actualizarConfigSmtp, obtenerConfigSmtp } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

const VACIO = { host: "", port: "", secure: false, usuario: "", password: "", fromEmail: "", fromName: "ABOFIT" };

export default function ConfigSmtp() {
  const { token } = useAuth();

  const [form, setForm] = useState(VACIO);
  const [passwordConfigurada, setPasswordConfigurada] = useState(false);
  const [cargado, setCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerConfigSmtp(token)
      .then(({ config }) => {
        if (config) {
          setForm({
            host: config.host ?? "",
            port: config.port ? String(config.port) : "",
            secure: config.secure,
            usuario: config.usuario ?? "",
            password: "",
            fromEmail: config.fromEmail ?? "",
            fromName: config.fromName,
          });
          setPasswordConfigurada(config.passwordConfigurada);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la configuración."))
      .finally(() => setCargado(true));
  }, [token]);

  async function handleGuardar(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setMensaje(null);
    setGuardando(true);

    try {
      const respuesta = await actualizarConfigSmtp(token, {
        host: form.host,
        port: form.port ? Number(form.port) : null,
        secure: form.secure,
        usuario: form.usuario,
        password: form.password,
        fromEmail: form.fromEmail,
        fromName: form.fromName,
      });
      setMensaje(respuesta.message);
      if (form.password) {
        setPasswordConfigurada(true);
        setForm((f) => ({ ...f, password: "" }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  if (!cargado) {
    return (
      <main className="wide">
        <span className="eyebrow">Configuración</span>
        <h1>SMTP</h1>
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="wide">
      <span className="eyebrow">Configuración</span>
      <h1>SMTP</h1>
      <p style={{ color: "var(--muted)", marginTop: 8 }}>
        Datos del servidor de correo saliente. Se usa para enviar los enlaces de definición de contraseña a
        clientes y entrenadores nuevos.
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <form onSubmit={handleGuardar}>
          <label>Servidor (host)</label>
          <input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="smtp.gmail.com" />

          <label>Puerto</label>
          <input
            type="number"
            value={form.port}
            onChange={(e) => setForm({ ...form, port: e.target.value })}
            placeholder="587"
          />

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0" }}>
            <input
              type="checkbox"
              id="smtp-secure"
              checked={form.secure}
              onChange={(e) => setForm({ ...form, secure: e.target.checked })}
            />
            <label htmlFor="smtp-secure" style={{ margin: 0, cursor: "pointer" }}>
              Usar SSL/TLS directo (puerto 465). Déjalo sin marcar para 587 (STARTTLS).
            </label>
          </div>

          <label>Usuario</label>
          <input value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} placeholder="tucuenta@gmail.com" />

          <label>Contraseña {passwordConfigurada && <span style={{ color: "var(--muted)", fontWeight: 400 }}>(ya configurada)</span>}</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={passwordConfigurada ? "Dejar en blanco para no cambiarla" : "Contraseña de aplicación"}
          />

          <label>Correo remitente</label>
          <input
            type="email"
            value={form.fromEmail}
            onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
            placeholder="no-reply@abofit.com"
          />

          <label>Nombre del remitente</label>
          <input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} required />

          {mensaje && <p role="status">{mensaje}</p>}
          {error && <p role="alert">{error}</p>}

          <button type="submit" disabled={guardando} style={{ marginTop: 8 }}>
            {guardando ? "Guardando..." : "Guardar configuración"}
          </button>
        </form>
      </div>
    </main>
  );
}
