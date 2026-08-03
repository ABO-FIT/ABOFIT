import { useEffect, useState } from "react";
import { guardarRutinaCliente, obtenerRutinaCliente, type DiaRutina } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

function nuevoDia(): DiaRutina {
  return { id: `d${Date.now()}`, day: "", focus: "", exercises: [""] };
}

export default function RutinaBuilder({ clientId }: { clientId: number }) {
  const { token } = useAuth();
  const [dias, setDias] = useState<DiaRutina[]>([]);
  const [personalizada, setPersonalizada] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!token) return;
    obtenerRutinaCliente(token, clientId)
      .then((respuesta) => {
        setDias(respuesta.dias);
        setPersonalizada(respuesta.personalizada);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la rutina."));
  }, [token, clientId]);

  function actualizarDia(index: number, cambios: Partial<DiaRutina>) {
    setDias(dias.map((dia, i) => (i === index ? { ...dia, ...cambios } : dia)));
  }

  function actualizarEjercicio(diaIndex: number, ejercicioIndex: number, valor: string) {
    const dia = dias[diaIndex];
    const exercises = dia.exercises.map((ej, i) => (i === ejercicioIndex ? valor : ej));
    actualizarDia(diaIndex, { exercises });
  }

  function agregarEjercicio(diaIndex: number) {
    const dia = dias[diaIndex];
    actualizarDia(diaIndex, { exercises: [...dia.exercises, ""] });
  }

  function quitarEjercicio(diaIndex: number, ejercicioIndex: number) {
    const dia = dias[diaIndex];
    actualizarDia(diaIndex, { exercises: dia.exercises.filter((_, i) => i !== ejercicioIndex) });
  }

  function agregarDia() {
    setDias([...dias, nuevoDia()]);
  }

  function quitarDia(index: number) {
    setDias(dias.filter((_, i) => i !== index));
  }

  async function handleGuardar() {
    if (!token) return;
    setError(null);
    setMensaje(null);
    setGuardando(true);

    try {
      const respuesta = await guardarRutinaCliente(token, clientId, dias);
      setMensaje(respuesta.message);
      setPersonalizada(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="card">
      <h2>Rutina {personalizada ? "personalizada" : "por defecto (según objetivo)"}</h2>

      <div style={{ display: "grid", gap: 12 }}>
        {dias.map((dia, diaIndex) => (
          <div key={dia.id} className="card">
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Día (ej. Lunes)" value={dia.day} onChange={(e) => actualizarDia(diaIndex, { day: e.target.value })} />
              <input placeholder="Enfoque" value={dia.focus} onChange={(e) => actualizarDia(diaIndex, { focus: e.target.value })} />
              <button type="button" className="secondary" onClick={() => quitarDia(diaIndex)}>Quitar día</button>
            </div>

            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
              {dia.exercises.map((ejercicio, ejercicioIndex) => (
                <div key={ejercicioIndex} style={{ display: "flex", gap: 8 }}>
                  <input
                    style={{ flex: 1 }}
                    value={ejercicio}
                    onChange={(e) => actualizarEjercicio(diaIndex, ejercicioIndex, e.target.value)}
                    placeholder="Ejercicio (ej. Sentadilla 4×10)"
                  />
                  <button type="button" className="secondary" onClick={() => quitarEjercicio(diaIndex, ejercicioIndex)}>×</button>
                </div>
              ))}
              <button type="button" className="secondary" onClick={() => agregarEjercicio(diaIndex)}>+ Ejercicio</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" className="secondary" onClick={agregarDia}>+ Agregar día</button>
        <button type="button" onClick={handleGuardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar rutina personalizada"}
        </button>
      </div>

      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
