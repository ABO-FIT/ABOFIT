import { useEffect, useState } from "react";
import { obtenerPedidos, type Pedido } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../lib/money";

const ESTADOS: Record<Pedido["estado"], string> = {
  pendiente: "Pendiente",
  recibido: "Recibido",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function MisPedidos() {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerPedidos(token)
      .then(({ pedidos }) => setPedidos(pedidos))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar tus pedidos."));
  }, [token]);

  if (error) {
    return (
      <main className="wide">
        <p role="alert">{error}</p>
      </main>
    );
  }

  return (
    <main className="wide">
      <h1>Mis Pedidos</h1>

      {pedidos.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no has hecho pedidos.</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Pedido #{pedido.id}</strong>
              <span className="tag" style={{ background: "var(--line)" }}>{ESTADOS[pedido.estado]}</span>
            </div>
            <p style={{ color: "var(--muted)", margin: "4px 0" }}>{new Date(pedido.fecha).toLocaleDateString("es-DO")}</p>
            <ul>
              {pedido.items.map((item, index) => (
                <li key={index}>{item.qty} × {item.name} — {money(item.price * item.qty)}</li>
              ))}
            </ul>
            <strong>Total: {money(pedido.total)}</strong>
          </div>
        ))}
      </div>
    </main>
  );
}
