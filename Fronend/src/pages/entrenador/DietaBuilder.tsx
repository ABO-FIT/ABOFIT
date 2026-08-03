import { useEffect, useState } from "react";
import { guardarDietaCliente, obtenerDietaCliente, type Comida } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function DietaBuilder({ clientId }: { clientId: number }) {
  const { token } = useAuth();
  const [nota, setNota] = useState("");
  const [comidas, setComidas] = useState<Comida[]>([]);
  const [personalizada, setPersonalizada] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!token) return;
    obtenerDietaCliente(token, clientId)
      .then((respuesta) => {
        setNota(respuesta.nota);
        setComidas(respuesta.comidas);
        setPersonalizada(respuesta.personalizada);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la dieta."));
  }, [token, clientId]);

  function actualizarComida(index: number, cambios: Partial<Comida>) {
    setComidas(comidas.map((c, i) => (i === index ? { ...c, ...cambios } : c)));
  }

  function agregarComida() {
    setComidas([...comidas, { meal: "", items: "" }]);
  }

  function quitarComida(index: number) {
    setComidas(comidas.filter((_, i) => i !== index));
  }

  async function handleGuardar() {
    if (!token) return;
    setError(null);
    setMensaje(null);
    setGuardando(true);

    try {
      const respuesta = await guardarDietaCliente(token, clientId, nota, comidas);
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
      <h2>Nutrición {personalizada ? "personalizada" : "por defecto (según objetivo)"}</h2>

      <label htmlFor="nota">Nota general</label>
      <textarea id="nota" rows={2} value={nota} onChange={(e) => setNota(e.target.value)} />

      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {comidas.map((comida, index) => (
          <div key={index} style={{ display: "flex", gap: 8 }}>
            <input placeholder="Comida (ej. Desayuno)" value={comida.meal} onChange={(e) => actualizarComida(index, { meal: e.target.value })} />
            <input style={{ flex: 1 }} placeholder="Detalle" value={comida.items} onChange={(e) => actualizarComida(index, { items: e.target.value })} />
            <button type="button" className="secondary" onClick={() => quitarComida(index)}>×</button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" className="secondary" onClick={agregarComida}>+ Agregar comida</button>
        <button type="button" onClick={handleGuardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar dieta personalizada"}
        </button>
      </div>

      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
