import { useEffect, useState } from "react";
import { marcarDiaRutina, obtenerMisRutinas, type MisRutinasRespuesta } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import ErrorReintentar from "../../components/ErrorReintentar";

export default function MisRutinas() {
  const { token } = useAuth();
  const [datos, setDatos] = useState<MisRutinasRespuesta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avisoAccion, setAvisoAccion] = useState<string | null>(null);

  function cargar() {
    if (!token) return;
    setError(null);
    obtenerMisRutinas(token)
      .then(setDatos)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar tus rutinas."));
  }

  useEffect(cargar, [token]);

  async function toggle(diaId: string) {
    if (!token) return;
    setAvisoAccion(null);
    try {
      await marcarDiaRutina(token, diaId);
      cargar();
    } catch (err) {
      setAvisoAccion(err instanceof Error ? err.message : "No se pudo actualizar el entrenamiento.");
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
        <h1>Mis Rutinas</h1>
        <p>Aún no tienes un objetivo asignado. Tu entrenador lo asignará próximamente.</p>
      </main>
    );
  }

  const { dias, completados, porcentaje } = datos;

  return (
    <main className="wide">
      <h1>Mis Rutinas</h1>

      {avisoAccion && <p role="alert">{avisoAccion}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <strong>Cumplimiento de esta semana: {porcentaje}%</strong>
        <div style={{ height: 8, background: "var(--line)", borderRadius: 999, marginTop: 8 }}>
          <div style={{ height: 8, width: `${porcentaje}%`, background: "var(--grad)", borderRadius: 999 }} />
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {dias.map((dia) => {
          const completado = completados.includes(dia.id);
          return (
            <div key={dia.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <strong>
                  {dia.day} — {dia.focus}
                </strong>
                <button type="button" className={completado ? "" : "secondary"} onClick={() => toggle(dia.id)}>
                  {completado ? "Completado ✓" : "Marcar completado"}
                </button>
              </div>
              <ul>
                {dia.exercises.map((ejercicio) => (
                  <li key={ejercicio}>{ejercicio}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </main>
  );
}
