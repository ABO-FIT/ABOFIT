import { useEffect, useState } from "react";
import { editarPlan, obtenerPlanesAdmin, type PlanAdmin } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function Planes() {
  const { token } = useAuth();
  const [planes, setPlanes] = useState<PlanAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  function cargar() {
    if (!token) return;
    obtenerPlanesAdmin(token)
      .then(({ planes }) => setPlanes(planes))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los planes."));
  }

  useEffect(cargar, [token]);

  function actualizarCampo(key: string, cambios: Partial<PlanAdmin>) {
    setPlanes(planes.map((p) => (p.key === key ? { ...p, ...cambios } : p)));
  }

  async function guardar(plan: PlanAdmin) {
    if (!token) return;
    setError(null);
    setMensaje(null);
    try {
      await editarPlan(token, plan.key, {
        name: plan.name,
        price: plan.price,
        includesDiet: plan.includes_diet,
        description: plan.description,
      });
      setMensaje(`Plan ${plan.key} actualizado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  return (
    <main className="wide">
      <h1>Planes</h1>

      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}

      <div style={{ display: "grid", gap: 16 }}>
        {planes.map((plan) => (
          <div key={plan.key} className="card">
            <h3>Plan {plan.key}</h3>
            <label>Nombre</label>
            <input value={plan.name} onChange={(e) => actualizarCampo(plan.key, { name: e.target.value })} />
            <label>Precio (RD$/mes)</label>
            <input type="number" value={plan.price} onChange={(e) => actualizarCampo(plan.key, { price: Number(e.target.value) })} />
            <label>Descripción</label>
            <textarea rows={2} value={plan.description} onChange={(e) => actualizarCampo(plan.key, { description: e.target.value })} />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={plan.includes_diet}
                onChange={(e) => actualizarCampo(plan.key, { includes_diet: e.target.checked })}
              />
              Incluye dieta
            </label>
            <button type="button" onClick={() => guardar(plan)} style={{ marginTop: 8 }}>Guardar</button>
          </div>
        ))}
      </div>
    </main>
  );
}
