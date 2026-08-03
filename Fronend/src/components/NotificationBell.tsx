import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { marcarNotificacionLeida, marcarTodasLeidas, obtenerNotificaciones, type Notificacion } from "../api/client";
import { useAuth } from "../context/AuthContext";

function BellSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

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
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-label="Notificaciones" className="top-icon">
        <BellSVG />
        {noLeidas > 0 && <span className="top-badge">{noLeidas}</span>}
      </button>

      {abierto && (
        <div className="notif-drop">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ fontSize: 14 }}>Notificaciones</strong>
            {noLeidas > 0 && (
              <button type="button" className="secondary" style={{ fontSize: 11, padding: "4px 8px" }} onClick={handleMarcarTodas}>
                Marcar todas leídas
              </button>
            )}
          </div>

          {notificaciones.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Sin notificaciones.</p>}

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
                borderRadius: 8,
                borderBottom: "1px solid var(--line)",
                padding: "8px 6px",
                cursor: "pointer",
                color: "var(--text)",
                fontWeight: 400,
              }}
            >
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{n.titulo}</p>
              {n.subtitulo && <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{n.subtitulo}</p>}
              <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>{new Date(n.created_at).toLocaleString("es-DO")}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
