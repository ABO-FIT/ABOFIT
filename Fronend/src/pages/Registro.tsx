import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { registrarUsuario, type RegistroPayload, type TipoRegistro } from "../api/client";
import AuthLayout from "../components/AuthLayout";

const ESTADO_INICIAL: RegistroPayload = {
  nombre: "",
  apellido: "",
  correo: "",
  usuario: "",
  telefono: "",
  tipo: "Cliente",
  especialidad: "",
  bio: "",
};

const ROLES: { tipo: TipoRegistro; icono: string; titulo: string; sub: string }[] = [
  { tipo: "Cliente", icono: "◉", titulo: "Cliente", sub: "Quiero entrenar y comprar suplementos." },
  { tipo: "Entrenador", icono: "◈", titulo: "Entrenador", sub: "Quiero gestionar clientes y planes." },
];

export default function Registro() {
  const [form, setForm] = useState<RegistroPayload>(ESTADO_INICIAL);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMensaje(null);
    setEnviando(true);

    try {
      const respuesta = await registrarUsuario(form);
      setMensaje(respuesta.message);
      setForm(ESTADO_INICIAL);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Crear cuenta</h1>

      <div className="role-cards">
        {ROLES.map((r) => (
          <div
            key={r.tipo}
            className={`role-card ${form.tipo === r.tipo ? "selected" : ""}`}
            onClick={() => setForm({ ...form, tipo: r.tipo })}
          >
            <div className="rc-icon">{r.icono}</div>
            <div className="rc-title">{r.titulo}</div>
            <div className="rc-sub">{r.sub}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
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

        <label htmlFor="usuario">Usuario</label>
        <input
          id="usuario"
          value={form.usuario}
          onChange={(e) => setForm({ ...form, usuario: e.target.value })}
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          title="Letras, números o guión bajo (3 a 20 caracteres)"
          required
        />

        <label htmlFor="telefono">Teléfono</label>
        <input
          id="telefono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          required
        />

        {form.tipo === "Entrenador" && (
          <>
            <label htmlFor="especialidad">Especialidad</label>
            <input
              id="especialidad"
              value={form.especialidad}
              onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
              required
            />

            <label htmlFor="bio">Biografía (opcional)</label>
            <textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
            />
          </>
        )}

        <button type="submit" className="block" disabled={enviando}>
          {enviando ? "Enviando..." : "Registrarme"}
        </button>
      </form>

      {mensaje && <p role="status" style={{ marginTop: 12 }}>{mensaje}</p>}
      {error && <p role="alert" style={{ marginTop: 12 }}>{error}</p>}

      <div className="auth-links" style={{ justifyContent: "center" }}>
        <span>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></span>
      </div>
    </AuthLayout>
  );
}
