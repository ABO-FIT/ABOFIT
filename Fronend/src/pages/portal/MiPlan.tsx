import { useEffect, useState } from "react";
import { money } from "../../lib/money";
import { obtenerMiPlan, type MiPlanRespuesta } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function MiPlan() {
  const { token } = useAuth();
  const [datos, setDatos] = useState<MiPlanRespuesta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerMiPlan(token)
      .then(setDatos)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar tu plan."));
  }, [token]);

  if (error) {
    return (
      <main className="wide">
        <p role="alert">{error}</p>
      </main>
    );
  }

  if (!datos) {
    return (
      <main className="wide">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!datos.asignado) {
    return (
      <main className="wide">
        <h1>Mi Plan</h1>
        <p>Aún no tienes un plan asignado. Tu entrenador lo asignará próximamente.</p>
      </main>
    );
  }

  const { plan, goal, rutina, dieta } = datos;

  return (
    <main className="wide">
      <h1>Mi Plan</h1>

      {goal && (
        <span className="tag" style={{ background: `${goal.color}22`, color: goal.color }}>
          {goal.shortLabel}
        </span>
      )}

      {plan && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>{plan.name}</h2>
          <p style={{ fontWeight: 700, fontSize: 20 }}>{money(plan.price)}/mes</p>
          <p style={{ color: "var(--muted)" }}>{plan.description}</p>
        </div>
      )}

      <h2 style={{ marginTop: 24 }}>Rutina semanal</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {rutina.map((dia) => (
          <div key={dia.id} className="card">
            <strong>
              {dia.day} — {dia.focus}
            </strong>
            <ul>
              {dia.exercises.map((ejercicio) => (
                <li key={ejercicio}>{ejercicio}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {dieta && (
        <>
          <h2 style={{ marginTop: 24 }}>Plan de alimentación</h2>
          <p style={{ color: "var(--muted)" }}>{dieta.nota}</p>
          <div style={{ display: "grid", gap: 8 }}>
            {dieta.comidas.map((comida) => (
              <div key={comida.meal} className="card">
                <strong>{comida.meal}</strong>
                <p>{comida.items}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
