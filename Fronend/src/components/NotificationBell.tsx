import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { marcarNotificacionLeida, marcarTodasLeidas, obtenerNotificaciones, type Notificacion } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function NotificationBell() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  function cargar() {
    if (!token) return;
    obtenerNotificaciones(token)
      .then((respuesta) => {
        setNotificaciones(respuesta.notificaciones);
        setNoLeidas(respuesta.noLeidas);
      })
      .catch(() => {});
  }

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 30000);
    return () => clearInterval(intervalo);
  }, [token]);

  useEffect(() => {
    function handleClickFuera(event: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  async function handleAbrir() {
    setAbierto((v) => !v);
  }

  async function handleClickNotificacion(n: Notificacion) {
    if (!token) return;
    if (!n.leido) {
      await marcarNotificacionLeida(token, n.id);
      cargar();
    }
    setAbierto(false);
    if (n.link) navigate(n.link);
  }

  async function handleMarcarTodas() {
    if (!token) return;
    await marcarTodasLeidas(token);
    cargar();
  }

  return (
    <div ref={contenedorRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleAbrir}
        aria-label="Notificaciones"
        style={{
          background: "transparent",
          border: "none",
          color: "inherit",
          fontSize: 20,
          cursor: "pointer",
          position: "relative",
          padding: 6,
        }}
      >
        🔔
        {noLeidas > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "var(--accent2)",
              color: "#fff",
              borderRadius: "999px",
              fontSize: 11,
              fontWeight: 700,
              padding: "1px 5px",
              lineHeight: "14px",
            }}
          >
            {noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className="card"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 320,
            maxHeight: 400,
            overflowY: "auto",
            zIndex: 20,
            padding: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong>Notificaciones</strong>
            {noLeidas > 0 && (
              <button type="button" className="secondary" style={{ fontSize: 12, padding: "4px 8px" }} onClick={handleMarcarTodas}>
                Marcar todas leídas
              </button>
            )}
          </div>

          {notificaciones.length === 0 && <p style={{ color: "var(--muted)", fontSize: 14 }}>Sin notificaciones.</p>}

          {notificaciones.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleClickNotificacion(n)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: n.leido ? "transparent" : "var(--oks)",
                border: "none",
                borderBottom: "1px solid var(--line)",
                padding: "8px 4px",
                cursor: "pointer",
                color: "var(--text)",
              }}
            >
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{n.titulo}</p>
              {n.subtitulo && <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{n.subtitulo}</p>}
              <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>{new Date(n.created_at).toLocaleString("es-DO")}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
