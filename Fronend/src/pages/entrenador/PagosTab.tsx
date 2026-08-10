import { useEffect, useState, type FormEvent } from "react";
import { cambiarEstadoPago, obtenerPagosCliente, registrarPago, type Pago } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const VACIO = { monto: "", concepto: "", fecha: new Date().toISOString().slice(0, 10), estado: "pendiente" as "pagado" | "pendiente" };

export default function PagosTab({ clientId }: { clientId: number }) {
  const { token } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [formAbierto, setFormAbierto] = useState(false);
  const [cargado, setCargado] = useState(false);

  function cargar() {
    if (!token) return;
    obtenerPagosCliente(token, clientId)
      .then(({ pagos }) => setPagos(pagos))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los pagos."))
      .finally(() => setCargado(true));
  }

  useEffect(cargar, [token, clientId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setMensaje(null);
    setGuardando(true);

    try {
      const respuesta = await registrarPago(token, clientId, { ...form, monto: Number(form.monto) });
      setMensaje(respuesta.message);
      setForm(VACIO);
      setFormAbierto(false);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleEstado(pago: Pago) {
    if (!token) return;
    setError(null);
    const nuevoEstado = pago.estado === "pagado" ? "pendiente" : "pagado";
    try {
      await cambiarEstadoPago(token, clientId, pago.id, nuevoEstado);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Pagos de mensualidad</h2>
        <button type="button" className="secondary" onClick={() => setFormAbierto((v) => !v)}>
          {formAbierto ? "Cancelar" : "Registrar pago manual"}
        </button>
      </div>

      {formAbierto && (
        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
            Usa esto solo para pagos recibidos fuera del sistema (efectivo, transferencia directa, etc.). Los cobros
            del plan se generan automáticamente y el cliente puede pagarlos desde su perfil.
          </p>
          <div className="form-grid-4">
            <div>
              <label>Concepto</label>
              <input value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} placeholder="Mensualidad agosto" required />
            </div>
            <div>
              <label>Monto (RD$)</label>
              <input type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} required />
            </div>
            <div>
              <label>Fecha</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
            </div>
            <div>
              <label>Estado</label>
              <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as "pagado" | "pendiente" })}>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>
            <button type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Registrar"}</button>
          </div>
        </form>
      )}

      {mensaje && <p role="status" style={{ marginTop: 8 }}>{mensaje}</p>}
      {error && <p role="alert" style={{ marginTop: 8 }}>{error}</p>}

      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {pagos.map((pago) => (
          <div key={pago.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)", flexWrap: "wrap", gap: 8 }}>
            <div>
              <strong>{pago.concepto}</strong>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{new Date(pago.fecha).toLocaleDateString("es-DO")} · {money(pago.monto)}</p>
              {pago.comprobante_path && (
                <a href={`${API_URL}${pago.comprobante_path}`} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                  Ver comprobante
                </a>
              )}
            </div>
            <button
              type="button"
              className={pago.estado === "pagado" ? "" : "secondary"}
              onClick={() => toggleEstado(pago)}
            >
              {pago.estado === "pagado" ? "Pagado ✓" : "Marcar pagado"}
            </button>
          </div>
        ))}
        {!cargado && <p style={{ color: "var(--muted)" }}>Cargando...</p>}
        {cargado && pagos.length === 0 && <p style={{ color: "var(--muted)" }}>Sin pagos registrados.</p>}
      </div>
    </div>
  );
}
