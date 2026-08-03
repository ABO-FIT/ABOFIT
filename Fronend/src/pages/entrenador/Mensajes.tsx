import { useEffect, useState, type FormEvent } from "react";
import {
  enviarMensajeACliente,
  obtenerClientesConMensajes,
  obtenerHiloCliente,
  type ClienteMensajes,
  type Mensaje,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function Mensajes() {
  const { token } = useAuth();
  const [clientes, setClientes] = useState<ClienteMensajes[]>([]);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cargarClientes() {
    if (!token) return;
    obtenerClientesConMensajes(token)
      .then(({ clientes }) => setClientes(clientes))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los clientes."));
  }

  useEffect(cargarClientes, [token]);

  function cargarHilo(clientId: number) {
    if (!token) return;
    obtenerHiloCliente(token, clientId)
      .then(({ mensajes }) => setMensajes(mensajes))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el hilo."))
      .finally(cargarClientes);
  }

  function seleccionar(clientId: number) {
    setSeleccionado(clientId);
    cargarHilo(clientId);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || !seleccionado || !texto.trim()) return;

    setEnviando(true);
    try {
      await enviarMensajeACliente(token, seleccionado, texto.trim());
      setTexto("");
      cargarHilo(seleccionado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="wide">
      <h1>Mensajes</h1>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
        <div style={{ display: "grid", gap: 8 }}>
          {clientes.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              className={seleccionado === cliente.id ? "" : "secondary"}
              onClick={() => seleccionar(cliente.id)}
              style={{ textAlign: "left" }}
            >
              {cliente.nombre} {cliente.apellido}
              {cliente.noLeidos > 0 && <span className="tag" style={{ background: "var(--accent2)", color: "#fff", marginLeft: 8 }}>{cliente.noLeidos}</span>}
            </button>
          ))}
          {clientes.length === 0 && <p style={{ color: "var(--muted)" }}>Sin clientes asignados.</p>}
        </div>

        <div>
          {!seleccionado && <p style={{ color: "var(--muted)" }}>Selecciona un cliente para ver la conversación.</p>}

          {seleccionado && (
            <>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                {mensajes.map((mensaje) => (
                  <div
                    key={mensaje.id}
                    style={{
                      alignSelf: mensaje.remitente === "entrenador" ? "flex-end" : "flex-start",
                      background: mensaje.remitente === "entrenador" ? "var(--oks)" : "var(--bg)",
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
                <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje..." style={{ flex: 1 }} />
                <button type="submit" disabled={enviando}>Enviar</button>
              </form>
            </>
          )}
        </div>
      </div>

      {error && <p role="alert">{error}</p>}
    </main>
  );
}
