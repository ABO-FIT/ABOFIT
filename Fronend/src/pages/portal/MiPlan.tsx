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
        <span className="eyebrow">Tu suscripción</span>
        <h1>Mi plan</h1>
        <p>Aún no tienes un plan asignado. Tu entrenador lo asignará próximamente.</p>
      </main>
    );
  }

  const { plan, goal, rutina, dieta } = datos;

  return (
    <main className="wide">
      <span className="eyebrow">Tu suscripción</span>
      <h1>Mi plan</h1>

      {plan && (
        <div className="card" style={{ background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className={`tag ${plan.key === "B" ? "b" : "a"}`}>{plan.name}</span>
            {goal && (
              <span className="tag" style={{ background: goal.color, color: "#fff" }}>
                {goal.shortLabel}
              </span>
            )}
          </div>
          <h2 style={{ fontFamily: "var(--disp)", fontSize: 26, margin: "12px 0 6px", color: "#fff" }}>{plan.name}</h2>
          <p style={{ color: "#aeb4c0", margin: 0, lineHeight: 1.6 }}>{plan.description}</p>
          {goal && <div style={{ color: "#cfd4dd", marginTop: 10, fontSize: 13 }}>Objetivo: {goal.label}</div>}
          <div style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: 34, color: "#fff", marginTop: 16 }}>
            {money(plan.price)}
            <span style={{ fontSize: 14, color: "#8b92a0", fontWeight: 500 }}> / mes</span>
          </div>
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
