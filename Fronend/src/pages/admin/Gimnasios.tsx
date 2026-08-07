import { useEffect, useState, type FormEvent } from "react";
import { crearGimnasio, editarGimnasio, eliminarGimnasio, obtenerGimnasiosAdmin, type Gimnasio } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const VACIO = { name: "", city: "", address: "", phone: "" };

export default function Gimnasios() {
  const { token } = useAuth();
  const [gimnasios, setGimnasios] = useState<Gimnasio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  function cargar() {
    if (!token) return;
    obtenerGimnasiosAdmin(token)
      .then(({ gimnasios }) => setGimnasios(gimnasios))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los gimnasios."));
  }

  useEffect(cargar, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    try {
      if (editandoId) {
        await editarGimnasio(token, editandoId, form);
      } else {
        await crearGimnasio(token, form);
      }
      setForm(VACIO);
      setEditandoId(null);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  function editar(g: Gimnasio) {
    setEditandoId(g.id);
    setForm({ name: g.name, city: g.city, address: g.address ?? "", phone: g.phone ?? "" });
  }

  async function eliminar(id: number) {
    if (!token) return;
    await eliminarGimnasio(token, id);
    cargar();
  }

  return (
    <main className="wide">
      <h1>Gimnasios</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{editandoId ? "Editar gimnasio" : "Nuevo gimnasio"}</h3>
        <form onSubmit={handleSubmit}>
          <label>Nombre</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <label>Ciudad</label>
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          <label>Dirección</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <label>Teléfono</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit">{editandoId ? "Guardar cambios" : "Crear gimnasio"}</button>
            {editandoId && (
              <button type="button" className="secondary" onClick={() => { setEditandoId(null); setForm(VACIO); }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <p role="alert">{error}</p>}

      <div style={{ display: "grid", gap: 8 }}>
        {gimnasios.map((g) => (
          <div key={g.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <strong>{g.name}</strong>
              <p style={{ margin: 0, color: "var(--muted)" }}>{g.city} {g.address ? `· ${g.address}` : ""} {g.phone ? `· ${g.phone}` : ""}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="secondary" onClick={() => editar(g)}>Editar</button>
              <button type="button" className="secondary" onClick={() => eliminar(g.id)}>Eliminar</button>
            </div>
          </div>
        ))}
        {gimnasios.length === 0 && <p style={{ color: "var(--muted)" }}>Sin gimnasios registrados.</p>}
      </div>
    </main>
  );
}
