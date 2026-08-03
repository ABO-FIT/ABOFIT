import { useEffect, useState, type FormEvent } from "react";
import { enviarMensaje, obtenerMensajes, type Mensaje } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function ContactoEntrenador() {
  const { token } = useAuth();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cargar() {
    if (!token) return;
    obtenerMensajes(token)
      .then(({ mensajes }) => setMensajes(mensajes))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los mensajes."));
  }

  useEffect(cargar, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || !texto.trim()) return;

    setError(null);
    setEnviando(true);

    try {
      await enviarMensaje(token, texto.trim());
      setTexto("");
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="wide">
      <h1>Contacto con mi entrenador</h1>

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
