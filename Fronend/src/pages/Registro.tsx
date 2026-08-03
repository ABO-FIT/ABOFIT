import { useState, type FormEvent } from "react";
import { registrarUsuario, type RegistroPayload } from "../api/client";

const TIPOS: RegistroPayload["tipo"][] = ["Cliente", "Entrenador", "Gimnasio"];

const ESTADO_INICIAL: RegistroPayload = {
  nombre: "",
  apellido: "",
  correo: "",
  usuario: "",
  tipo: "Cliente",
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
      <h1>Crear cuenta</h1>
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
          required
        />

        <label htmlFor="tipo">Tipo de persona</label>
        <select
          id="tipo"
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value as RegistroPayload["tipo"] })}
        >
          {TIPOS.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>

        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Registrarme"}
        </button>
      </form>

      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
