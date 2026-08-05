import { useEffect, useState } from "react";
import {
  eliminarPlantillaDieta,
  guardarDietaCliente,
  guardarPlantillaDieta,
  obtenerDietaCliente,
  obtenerPlantillasDieta,
  type Comida,
  type PlantillaDieta,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function DietaBuilder({ clientId }: { clientId: number }) {
  const { token } = useAuth();
  const [nota, setNota] = useState("");
  const [comidas, setComidas] = useState<Comida[]>([]);
  const [personalizada, setPersonalizada] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [plantillas, setPlantillas] = useState<PlantillaDieta[]>([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState("");

  function cargarPlantillas() {
    if (!token) return;
    obtenerPlantillasDieta(token).then(({ plantillas }) => setPlantillas(plantillas)).catch(() => {});
  }

  useEffect(() => {
    if (!token) return;
    obtenerDietaCliente(token, clientId)
      .then((respuesta) => {
        setNota(respuesta.nota);
        setComidas(respuesta.comidas);
        setPersonalizada(respuesta.personalizada);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la dieta."));
    cargarPlantillas();
  }, [token, clientId]);

  function cargarDesdePlantilla(id: string) {
    setPlantillaSeleccionada(id);
    const plantilla = plantillas.find((p) => String(p.id) === id);
    if (plantilla) {
      setNota(plantilla.nota);
      setComidas(plantilla.comidas);
    }
  }

  async function handleGuardarPlantilla() {
    if (!token || comidas.length === 0) return;
    const nombre = window.prompt("Nombre de la plantilla:");
    if (!nombre || !nombre.trim()) return;
    try {
      await guardarPlantillaDieta(token, nombre.trim(), nota, comidas);
      cargarPlantillas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la plantilla.");
    }
  }

  async function handleEliminarPlantilla(id: number) {
    if (!token) return;
    setError(null);
    try {
      await eliminarPlantillaDieta(token, id);
      setPlantillaSeleccionada("");
      cargarPlantillas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la plantilla.");
    }
  }

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

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <select value={plantillaSeleccionada} onChange={(e) => cargarDesdePlantilla(e.target.value)}>
          <option value="">Cargar desde plantilla...</option>
          {plantillas.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <button type="button" className="secondary" onClick={handleGuardarPlantilla} disabled={comidas.length === 0}>
          Guardar como plantilla
        </button>
        {plantillaSeleccionada && (
          <button type="button" className="secondary" onClick={() => handleEliminarPlantilla(Number(plantillaSeleccionada))}>
            Eliminar plantilla
          </button>
        )}
      </div>

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
