import { useEffect, useState } from "react";
import { obtenerPagoPendiente, subirComprobantePago, type PagoPendienteRespuesta } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { money } from "../lib/money";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function PagarPlanModal({ onClose }: { onClose: () => void }) {
  const { token } = useAuth();
  const [datos, setDatos] = useState<PagoPendienteRespuesta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  function cargar() {
    if (!token) return;
    obtenerPagoPendiente(token)
      .then(setDatos)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la información de pago."));
  }

  useEffect(cargar, [token]);

  async function handleSubir() {
    if (!token || !archivo || !datos?.pago) return;
    setError(null);
    setMensaje(null);
    setSubiendo(true);
    try {
      const respuesta = await subirComprobantePago(token, datos.pago.id, archivo);
      setMensaje(respuesta.message);
      setArchivo(null);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el comprobante.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <h3 style={{ fontFamily: "var(--disp)", textTransform: "uppercase", margin: "0 0 14px" }}>Pagar plan</h3>

        {error && <p role="alert">{error}</p>}
        {!datos && !error && <p>Cargando...</p>}

        {datos?.alDia && (
          <p style={{ color: "var(--muted)" }}>
            Ya estás al día. Tu plan está pagado hasta el {new Date(datos.vigenciaHasta ?? "").toLocaleDateString("es-DO")}.
          </p>
        )}

        {datos?.pago && (
          <>
            <div className="card" style={{ background: "var(--bg)" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{datos.pago.concepto}</p>
              <p style={{ margin: "4px 0 0", fontFamily: "var(--disp)", fontWeight: 700, fontSize: 22, color: "var(--accent2)" }}>
                {money(datos.pago.monto)}
              </p>
              {datos.pago.estado === "pagado" && (
                <span className="tag" style={{ marginTop: 8, background: "var(--oks)", color: "var(--ok)" }}>Pagado</span>
              )}
            </div>

            {datos.entrenador && (
              <div className="card" style={{ marginTop: 12, background: "var(--bg)" }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Datos para pago / depósito</p>
                <p style={{ margin: "6px 0 0", fontSize: 13 }}>
                  Entrenador: {datos.entrenador.nombre} {datos.entrenador.apellido}
                </p>
                {datos.entrenador.bankName ? (
                  <>
                    <p style={{ margin: 0, fontSize: 13 }}>Banco: {datos.entrenador.bankName}</p>
                    {datos.entrenador.bankAccount && <p style={{ margin: 0, fontSize: 13 }}>Cuenta: {datos.entrenador.bankAccount}</p>}
                    {datos.entrenador.bankHolder && <p style={{ margin: 0, fontSize: 13 }}>A nombre de: {datos.entrenador.bankHolder}</p>}
                    {datos.entrenador.payPhone && <p style={{ margin: 0, fontSize: 13 }}>Tel. de pago: {datos.entrenador.payPhone}</p>}
                  </>
                ) : (
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>
                    Tu entrenador aún no registró sus métodos de pago. Contáctalo directamente.
                  </p>
                )}
              </div>
            )}

            {datos.pago.estado === "pendiente" && (
              <div style={{ marginTop: 12 }}>
                <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 14 }}>Comprobante de pago</p>
                {datos.pago.comprobantePath ? (
                  <>
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
                      Ya enviaste un comprobante. Tu entrenador confirmará tu pago pronto. Si necesitas reemplazarlo, sube uno nuevo.
                    </p>
                    <img
                      src={`${API_URL}${datos.pago.comprobantePath}`}
                      alt="Comprobante de pago"
                      style={{ width: "100%", maxWidth: 220, borderRadius: 8, display: "block", marginBottom: 10 }}
                    />
                  </>
                ) : (
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
                    Después de transferir, sube una foto o captura del comprobante.
                  </p>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
                <button type="button" style={{ marginTop: 8, display: "block" }} disabled={!archivo || subiendo} onClick={handleSubir}>
                  {subiendo ? "Subiendo..." : datos.pago.comprobantePath ? "Reemplazar comprobante" : "Subir comprobante"}
                </button>
                {mensaje && <p role="status" style={{ marginTop: 8, fontSize: 13 }}>{mensaje}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
