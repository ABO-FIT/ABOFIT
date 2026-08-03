import { useEffect, useState, type FormEvent } from "react";
import {
  buscarEntrenador,
  enviarMensaje,
  obtenerMensajes,
  obtenerMiEntrenador,
  vincularEntrenador,
  type Entrenador,
  type Mensaje,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function ContactoEntrenador() {
  const { token } = useAuth();
  const [entrenador, setEntrenador] = useState<Entrenador | null | undefined>(undefined);
  const [usuarioBuscado, setUsuarioBuscado] = useState("");
  const [encontrado, setEncontrado] = useState<Entrenador | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [vinculando, setVinculando] = useState(false);

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cargarEntrenador() {
    if (!token) return;
    obtenerMiEntrenador(token)
      .then(({ entrenador }) => setEntrenador(entrenador))
      .catch(() => setEntrenador(null));
  }

  function cargarMensajes() {
    if (!token) return;
    obtenerMensajes(token)
      .then(({ mensajes }) => setMensajes(mensajes))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los mensajes."));
  }

  useEffect(cargarEntrenador, [token]);
  useEffect(() => {
    if (entrenador) cargarMensajes();
  }, [token, entrenador]);

  async function handleBuscar(event: FormEvent) {
    event.preventDefault();
    if (!token || !usuarioBuscado.trim()) return;

    setErrorBusqueda(null);
    setEncontrado(null);

    try {
      const respuesta = await buscarEntrenador(token, usuarioBuscado.trim());
      setEncontrado(respuesta.entrenador);
    } catch (err) {
      setErrorBusqueda(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function handleVincular() {
    if (!token || !encontrado) return;
    setVinculando(true);
    try {
      await vincularEntrenador(token, encontrado.usuario);
      setEncontrado(null);
      setUsuarioBuscado("");
      cargarEntrenador();
    } catch (err) {
      setErrorBusqueda(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setVinculando(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || !texto.trim()) return;

    setError(null);
    setEnviando(true);

    try {
      await enviarMensaje(token, texto.trim());
      setTexto("");
      cargarMensajes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  if (entrenador === undefined) {
    return (
      <main className="wide">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!entrenador) {
    return (
      <main className="wide">
        <h1>Vincular entrenador</h1>
        <p style={{ color: "var(--muted)" }}>Aún no tienes un entrenador. Búscalo por su usuario para vincularte.</p>

        <form onSubmit={handleBuscar}>
          <label htmlFor="usuarioEntrenador">Usuario del entrenador</label>
          <input
            id="usuarioEntrenador"
            value={usuarioBuscado}
            onChange={(e) => setUsuarioBuscado(e.target.value)}
            required
          />
          <button type="submit">Buscar</button>
        </form>

        {errorBusqueda && <p role="alert">{errorBusqueda}</p>}

        {encontrado && (
          <div className="card" style={{ marginTop: 16 }}>
            <strong>
              {encontrado.nombre} {encontrado.apellido}
            </strong>
            <p style={{ color: "var(--muted)" }}>@{encontrado.usuario} {encontrado.especialidad ? `· ${encontrado.especialidad}` : ""}</p>
            <button type="button" onClick={handleVincular} disabled={vinculando}>
              {vinculando ? "Vinculando..." : "Vincularme con este entrenador"}
            </button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="wide">
      <h1>Contacto con mi entrenador</h1>
      <p style={{ color: "var(--muted)" }}>
        {entrenador.nombre} {entrenador.apellido} (@{entrenador.usuario})
      </p>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
        {mensajes.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no hay mensajes.</p>}
        {mensajes.map((mensaje) => (
          <div
            key={mensaje.id}
            style={{
              alignSelf: mensaje.remitente === "cliente" ? "flex-end" : "flex-start",
              background: mensaje.remitente === "cliente" ? "var(--oks)" : "var(--bg)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "8px 12px",
              maxWidth: "70%",
            }}
          >
            <p style={{ margin: 0 }}>{mensaje.texto}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ flexDirection: "row", marginTop: 16 }}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe un mensaje..."
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={enviando}>
          Enviar
        </button>
      </form>

      {error && <p role="alert">{error}</p>}
    </main>
  );
}
