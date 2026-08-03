import { useEffect, useState, type FormEvent } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { obtenerProgreso, registrarProgreso, type ProgressEntry } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function MiProgreso() {
  const { token } = useAuth();
  const [entradas, setEntradas] = useState<ProgressEntry[]>([]);
  const [peso, setPeso] = useState("");
  const [cintura, setCintura] = useState("");
  const [nota, setNota] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    if (!token) return;
    obtenerProgreso(token)
      .then(({ entradas }) => setEntradas(entradas))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el progreso."));
  }

  useEffect(cargar, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setError(null);
    setMensaje(null);
    setGuardando(true);

    const formData = new FormData();
    formData.append("peso", peso);
    formData.append("cintura", cintura);
    formData.append("nota", nota);
    if (foto) formData.append("foto", foto);

    try {
      const respuesta = await registrarProgreso(token, formData);
      setMensaje(respuesta.message);
      setPeso("");
      setCintura("");
      setNota("");
      setFoto(null);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  const datosGrafico = [...entradas]
    .filter((entrada) => entrada.peso !== null)
    .reverse()
    .map((entrada) => ({ fecha: entrada.fecha, peso: Number(entrada.peso) }));

  return (
    <main className="wide">
      <h1>Mi Progreso</h1>

      <div className="card">
        <h2>Nuevo registro</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="peso">Peso (kg)</label>
          <input id="peso" type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} />

          <label htmlFor="cintura">Cintura (cm)</label>
          <input id="cintura" type="number" step="0.1" value={cintura} onChange={(e) => setCintura(e.target.value)} />

          <label htmlFor="nota">Nota</label>
          <textarea id="nota" rows={2} value={nota} onChange={(e) => setNota(e.target.value)} />

          <label htmlFor="foto">Foto (opcional)</label>
          <input
            id="foto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          />

          <button type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar registro"}
          </button>
        </form>
        {mensaje && <p role="status">{mensaje}</p>}
        {error && <p role="alert">{error}</p>}
      </div>

      {datosGrafico.length > 1 && (
        <div className="card" style={{ marginTop: 16, height: 260 }}>
          <h2>Evolución de peso</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosGrafico}>
              <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="peso" stroke="#f2811c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <h2 style={{ marginTop: 24 }}>Historial</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {entradas.map((entrada) => (
          <div key={entrada.id} className="card" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {entrada.foto_path && (
              <img
                src={`${API_URL}${entrada.foto_path}`}
                alt="Progreso"
                style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }}
              />
            )}
            <div>
              <strong>{entrada.fecha}</strong>
              <p style={{ margin: 0 }}>
                {entrada.peso ? `${entrada.peso} kg` : ""} {entrada.cintura ? `· Cintura ${entrada.cintura} cm` : ""}
              </p>
              {entrada.nota && <p style={{ margin: 0, color: "var(--muted)" }}>{entrada.nota}</p>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
