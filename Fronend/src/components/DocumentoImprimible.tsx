import { useEffect } from "react";

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

  return (
    <div
      className="print-area"
      style={{ position: "absolute", left: -9999, top: 0, width: 700, background: "#fff", color: "#111", padding: 32, fontFamily: "Arial, sans-serif" }}
    >
      <h1 style={{ margin: "0 0 4px", fontSize: 24 }}>{titulo}</h1>
      {subtitulo && <p style={{ margin: "0 0 20px", color: "#555" }}>{subtitulo}</p>}
      {secciones.map((seccion) => (
        <div key={seccion.encabezado} style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 6px", borderBottom: "1px solid #ddd", paddingBottom: 4 }}>{seccion.encabezado}</h2>
          {seccion.lineas.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {seccion.lineas.map((linea, i) => (
                <li key={i} style={{ marginBottom: 2 }}>{linea}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, color: "#777" }}>Sin información.</p>
          )}
        </div>
      ))}
    </div>
  );
}
