import { useEffect } from "react";
import { createPortal } from "react-dom";
import logoOnLight from "../assets/brand/logo-onlight.png";

export interface SeccionImprimible {
  encabezado: string;
  lineas: string[];
}

export default function DocumentoImprimible({
  titulo,
  subtitulo,
  secciones,
  onImpreso,
}: {
  titulo: string;
  subtitulo?: string;
  secciones: SeccionImprimible[];
  onImpreso: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 150);
    window.addEventListener("afterprint", onImpreso);
    return () => {
      clearTimeout(id);
      window.removeEventListener("afterprint", onImpreso);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div className="doc-imprimible" style={{ fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif", fontSize: 14, lineHeight: 1.4, color: "#111" }}>
      <div style={{ display: "flex", alignItems: "center", borderBottom: "3px solid #e85d04", paddingBottom: 16, marginBottom: 24 }}>
        <img src={logoOnLight} alt="ABOFIT" style={{ height: 44, width: "auto", display: "block" }} />
      </div>

      <h1 style={{ margin: "0 0 6px", fontSize: 24, lineHeight: 1.3 }}>{titulo}</h1>
      {subtitulo && <p style={{ margin: "0 0 20px", color: "#555" }}>{subtitulo}</p>}
      {secciones.map((seccion) => (
        <div key={seccion.encabezado} className="doc-imprimible-seccion" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, lineHeight: 1.4, margin: "0 0 10px", borderBottom: "1px solid #ddd", paddingBottom: 8 }}>{seccion.encabezado}</h2>
          {seccion.lineas.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
              {seccion.lineas.map((linea, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{linea}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, color: "#777" }}>Sin información.</p>
          )}
        </div>
      ))}
    </div>,
    document.body,
  );
}
