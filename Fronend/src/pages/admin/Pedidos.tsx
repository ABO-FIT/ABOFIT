import { useEffect, useState } from "react";
import { cambiarEstadoPedido, confirmarPagoPedido, obtenerPedidosAdmin, type PedidoAdmin } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const ESTADOS: PedidoAdmin["estado"][] = ["pendiente", "recibido", "entregado", "cancelado"];
const ETIQUETAS: Record<PedidoAdmin["estado"], string> = {
  pendiente: "Pendiente", recibido: "Recibido", entregado: "Entregado", cancelado: "Cancelado",
};

export default function Pedidos() {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<number | null>(null);

  function cargar() {
    if (!token) return;
    obtenerPedidosAdmin(token, filtro || undefined)
      .then(({ pedidos }) => setPedidos(pedidos))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los pedidos."));
  }

  useEffect(cargar, [token, filtro]);

  async function cambiarEstado(id: number, estado: PedidoAdmin["estado"]) {
    if (!token) return;
    setMensaje(null);
    setError(null);
    try {
      const respuesta = await cambiarEstadoPedido(token, id, estado);
      setMensaje(respuesta.message);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function confirmarPago(id: number) {
    if (!token) return;
    setMensaje(null);
    setError(null);
    setConfirmando(id);
    try {
      const respuesta = await confirmarPagoPedido(token, id);
      setMensaje(respuesta.message);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setConfirmando(null);
    }
  }

  return (
    <main className="wide">
      <h1>Pedidos</h1>

      <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ marginBottom: 16 }}>
        <option value="">Todos los estados</option>
        {ESTADOS.map((e) => <option key={e} value={e}>{ETIQUETAS[e]}</option>)}
      </select>

      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong>Pedido #{pedido.id}</strong>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  {pedido.cliente.nombre} {pedido.cliente.apellido} · {pedido.cliente.correo} · {pedido.cliente.telefono}
                </p>
                <p style={{ margin: 0, color: "var(--muted)" }}>{new Date(pedido.fecha).toLocaleDateString("es-DO")}</p>
              </div>
              <select value={pedido.estado} onChange={(e) => cambiarEstado(pedido.id, e.target.value as PedidoAdmin["estado"])}>
                {ESTADOS.map((e) => <option key={e} value={e}>{ETIQUETAS[e]}</option>)}
              </select>
            </div>
            <ul>
              {pedido.items.map((item, index) => (
                <li key={index}>{item.qty} × {item.name} — {money(item.price * item.qty)}</li>
              ))}
            </ul>
            <strong>Total: {money(pedido.total)}</strong>

            <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
              {pedido.facturaId ? (
                <span className="tag" style={{ background: "var(--oks)", color: "var(--ok)" }}>
                  Pagado · Factura {pedido.facturaNumero}
                </span>
              ) : pedido.comprobantePath ? (
                <div>
                  <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 14 }}>Comprobante enviado por el cliente</p>
                  <a href={`${API_URL}${pedido.comprobantePath}`} target="_blank" rel="noreferrer">
                    <img
                      src={`${API_URL}${pedido.comprobantePath}`}
                      alt="Comprobante de pago"
                      style={{ width: "100%", maxWidth: 260, borderRadius: 8, display: "block", marginBottom: 10 }}
                    />
                  </a>
                  <button type="button" disabled={confirmando === pedido.id} onClick={() => confirmarPago(pedido.id)}>
                    {confirmando === pedido.id ? "Confirmando..." : "Confirmar pago"}
                  </button>
                </div>
              ) : (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>El cliente aún no ha subido un comprobante de pago.</p>
              )}
            </div>
          </div>
        ))}
        {pedidos.length === 0 && <p style={{ color: "var(--muted)" }}>Sin pedidos.</p>}
      </div>
    </main>
  );
}
