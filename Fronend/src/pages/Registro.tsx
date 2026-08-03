import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { registrarUsuario, type RegistroPayload, type TipoRegistro } from "../api/client";
import logo from "../assets/brand/logo-onlight.png";

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
    <main>
      <div className="brand">
        <img src={logo} alt="ABOFIT" />
      </div>
      <h1>Crear cuenta</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["Cliente", "Entrenador"] as TipoRegistro[]).map((tipo) => (
          <button
            key={tipo}
            type="button"
            className={form.tipo === tipo ? "" : "secondary"}
            style={{ flex: 1 }}
            onClick={() => setForm({ ...form, tipo })}
          >
            {tipo}
          </button>
        ))}
      </div>

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

        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Registrarme"}
        </button>
      </form>

      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}

      <p style={{ marginTop: 16, fontSize: 14 }}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </main>
  );
}
