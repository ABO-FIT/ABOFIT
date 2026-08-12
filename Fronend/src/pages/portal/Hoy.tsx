import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { marcarComidaPlan, marcarDiaRutina, obtenerHoy, obtenerLogros, type HoyRespuesta, type Logro } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import ErrorReintentar from "../../components/ErrorReintentar";

export default function Hoy() {
  const { token } = useAuth();
  const [datos, setDatos] = useState<HoyRespuesta | null>(null);
  const [logros, setLogros] = useState<Logro[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [avisoAccion, setAvisoAccion] = useState<string | null>(null);

  function cargar() {
    if (!token) return;
    setError(null);
    obtenerHoy(token)
      .then(setDatos)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar tu día."));
    obtenerLogros(token)
      .then(({ logros }) => setLogros(logros))
      .catch(() => {});
  }

  useEffect(cargar, [token]);

  async function toggleHoy(diaId: string) {
    if (!token) return;
    setAvisoAccion(null);
    try {
      await marcarDiaRutina(token, diaId);
      cargar();
    } catch (err) {
      setAvisoAccion(err instanceof Error ? err.message : "No se pudo actualizar el entrenamiento.");
    }
  }

  async function toggleComida(meal: string) {
    if (!token) return;
    setAvisoAccion(null);
    try {
      await marcarComidaPlan(token, meal);
      cargar();
    } catch (err) {
      setAvisoAccion(err instanceof Error ? err.message : "No se pudo actualizar la comida.");
    }
  }

  if (error) {
    return <ErrorReintentar mensaje={error} onReintentar={cargar} />;
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
        <span className="eyebrow">Tu día</span>
        <h1>Hoy</h1>
        <p>Aún no tienes un plan y objetivo activos. Tu entrenador te los asignará próximamente.</p>
      </main>
    );
  }

  const { diaHoy, completadoHoy, comidas, comidasCompletadasHoy } = datos;

  return (
    <main className="wide">
      <span className="eyebrow">Tu día</span>
      <h1>Hoy</h1>

      {avisoAccion && <p role="alert">{avisoAccion}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 8px" }}>Entrenamiento de hoy</h2>
        {diaHoy ? (
          <>
            <strong>{diaHoy.day} — {diaHoy.focus}</strong>
            <ul>
              {diaHoy.exercises.map((ejercicio) => (
                <li key={ejercicio}>{ejercicio}</li>
              ))}
            </ul>
            <button type="button" className={completadoHoy ? "" : "secondary"} onClick={() => toggleHoy(diaHoy.id)}>
              {completadoHoy ? "Completado ✓" : "Marcar completado"}
            </button>
          </>
        ) : (
          <p style={{ color: "var(--muted)" }}>No tienes un entrenamiento asignado para hoy. Revisa <Link to="/portal/mis-rutinas">tus rutinas</Link>.</p>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 8px" }}>Tu alimentación</h2>
        {comidas.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {comidas.map((comida) => {
              const consumida = comidasCompletadasHoy.includes(comida.meal);
              return (
                <label
                  key={comida.meal}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", margin: 0 }}
                >
                  <input
                    type="checkbox"
                    checked={consumida}
                    onChange={() => toggleComida(comida.meal)}
                    style={{ marginTop: 4 }}
                  />
                  <div>
                    <strong style={{ textDecoration: consumida ? "line-through" : "none" }}>{comida.meal}</strong>
                    <p style={{ margin: 0, color: "var(--muted)" }}>{comida.items}</p>
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>Tu plan actual no incluye un plan de alimentación asignado.</p>
        )}
      </div>

      {logros.length > 0 && (
        <div className="card">
          <h2 style={{ margin: "0 0 8px" }}>Logros</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {logros.map((logro) => (
              <span
                key={logro.id}
                className="tag"
                title={logro.descripcion}
                style={{
                  background: logro.conseguido ? "var(--oks)" : "var(--line)",
                  color: logro.conseguido ? "var(--ok)" : "var(--muted)",
                }}
              >
                {logro.conseguido ? "✓ " : ""}
                {logro.titulo}
              </span>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
