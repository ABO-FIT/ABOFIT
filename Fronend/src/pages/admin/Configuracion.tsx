import { useEffect, useState, type FormEvent } from "react";
import {
  actualizarPlantillaFactura,
  crearCategoria,
  crearObjetivo,
  editarCategoria,
  editarObjetivo,
  eliminarCategoria,
  eliminarObjetivo,
  obtenerCategoriasAdmin,
  obtenerObjetivosAdmin,
  obtenerPlantillaFactura,
  type CategoriaAdmin,
  type GoalAdmin,
  type PlantillaFactura,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const OBJETIVO_VACIO = { key: "", label: "", shortLabel: "", color: "#f2811c" };

export default function Configuracion() {
  const { token } = useAuth();

  // Objetivos
  const [objetivos, setObjetivos] = useState<GoalAdmin[]>([]);
  const [formObjetivo, setFormObjetivo] = useState(OBJETIVO_VACIO);
  const [editandoObjetivo, setEditandoObjetivo] = useState<string | null>(null);
  const [errorObjetivos, setErrorObjetivos] = useState<string | null>(null);

  // Categorías
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [editandoCategoria, setEditandoCategoria] = useState<{ id: number; name: string } | null>(null);
  const [errorCategorias, setErrorCategorias] = useState<string | null>(null);

  // Plantilla de factura
  const [plantilla, setPlantilla] = useState<PlantillaFactura | null>(null);
  const [mensajePlantilla, setMensajePlantilla] = useState<string | null>(null);
  const [errorPlantilla, setErrorPlantilla] = useState<string | null>(null);

  function cargarObjetivos() {
    if (!token) return;
    obtenerObjetivosAdmin(token).then(({ goals }) => setObjetivos(goals)).catch(() => {});
  }

  function cargarCategorias() {
    if (!token) return;
    obtenerCategoriasAdmin(token).then(({ categorias }) => setCategorias(categorias)).catch(() => {});
  }

  useEffect(() => {
    cargarObjetivos();
    cargarCategorias();
    if (token) {
      obtenerPlantillaFactura(token).then(({ plantilla }) => setPlantilla(plantilla)).catch(() => {});
    }
  }, [token]);

  async function handleSubmitObjetivo(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setErrorObjetivos(null);

    try {
      if (editandoObjetivo) {
        await editarObjetivo(token, editandoObjetivo, formObjetivo);
      } else {
        await crearObjetivo(token, formObjetivo);
      }
      setFormObjetivo(OBJETIVO_VACIO);
      setEditandoObjetivo(null);
      cargarObjetivos();
    } catch (err) {
      setErrorObjetivos(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  function editarObjetivoForm(g: GoalAdmin) {
    setEditandoObjetivo(g.key);
    setFormObjetivo({ key: g.key, label: g.label, shortLabel: g.short_label, color: g.color });
  }

  async function eliminarObjetivoClick(key: string) {
    if (!token) return;
    setErrorObjetivos(null);
    try {
      await eliminarObjetivo(token, key);
      cargarObjetivos();
    } catch (err) {
      setErrorObjetivos(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function handleCrearCategoria(event: FormEvent) {
    event.preventDefault();
    if (!token || !nuevaCategoria.trim()) return;
    setErrorCategorias(null);
    try {
      await crearCategoria(token, nuevaCategoria.trim());
      setNuevaCategoria("");
      cargarCategorias();
    } catch (err) {
      setErrorCategorias(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function handleGuardarCategoria() {
    if (!token || !editandoCategoria) return;
    setErrorCategorias(null);
    try {
      await editarCategoria(token, editandoCategoria.id, editandoCategoria.name);
      setEditandoCategoria(null);
      cargarCategorias();
    } catch (err) {
      setErrorCategorias(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function eliminarCategoriaClick(id: number) {
    if (!token) return;
    setErrorCategorias(null);
    try {
      await eliminarCategoria(token, id);
      cargarCategorias();
    } catch (err) {
      setErrorCategorias(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  async function handleGuardarPlantilla(event: FormEvent) {
    event.preventDefault();
    if (!token || !plantilla) return;
    setErrorPlantilla(null);
    setMensajePlantilla(null);
    try {
      const respuesta = await actualizarPlantillaFactura(token, {
        companyName: plantilla.company_name,
        tagline: plantilla.tagline ?? "",
        email: plantilla.email ?? "",
        phone: plantilla.phone ?? "",
        address: plantilla.address ?? "",
        bankName: plantilla.bank_name ?? "",
        bankAccount: plantilla.bank_account ?? "",
        bankHolder: plantilla.bank_holder ?? "",
        taxId: plantilla.tax_id ?? "",
      });
      setMensajePlantilla(respuesta.message);
    } catch (err) {
      setErrorPlantilla(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  return (
    <main className="wide">
      <span className="eyebrow">Sistema</span>
      <h1>Configuración</h1>

      {/* Objetivos */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2>Objetivos</h2>
        <form onSubmit={handleSubmitObjetivo}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
            <div>
              <label>Clave</label>
              <input
                value={formObjetivo.key}
                onChange={(e) => setFormObjetivo({ ...formObjetivo, key: e.target.value })}
                disabled={!!editandoObjetivo}
                placeholder="ej. resistencia"
                required
              />
            </div>
            <div>
              <label>Nombre</label>
              <input value={formObjetivo.label} onChange={(e) => setFormObjetivo({ ...formObjetivo, label: e.target.value })} required />
            </div>
            <div>
              <label>Nombre corto</label>
              <input value={formObjetivo.shortLabel} onChange={(e) => setFormObjetivo({ ...formObjetivo, shortLabel: e.target.value })} required />
            </div>
            <div>
              <label>Color</label>
              <input type="color" value={formObjetivo.color} onChange={(e) => setFormObjetivo({ ...formObjetivo, color: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit">{editandoObjetivo ? "Guardar cambios" : "Crear objetivo"}</button>
            {editandoObjetivo && (
              <button type="button" className="secondary" onClick={() => { setEditandoObjetivo(null); setFormObjetivo(OBJETIVO_VACIO); }}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        {errorObjetivos && <p role="alert" style={{ marginTop: 8 }}>{errorObjetivos}</p>}

        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          {objetivos.map((g) => (
            <div key={g.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: g.color, display: "inline-block" }} />
                <strong>{g.label}</strong>
                <span className="tag">{g.short_label}</span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>({g.key})</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="secondary" onClick={() => editarObjetivoForm(g)}>Editar</button>
                <button type="button" className="secondary" onClick={() => eliminarObjetivoClick(g.key)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categorías */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2>Categorías de catálogo</h2>
        <form onSubmit={handleCrearCategoria} style={{ flexDirection: "row" }}>
          <input placeholder="Nueva categoría" value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} style={{ flex: 1 }} />
          <button type="submit">Agregar</button>
        </form>

        {errorCategorias && <p role="alert" style={{ marginTop: 8 }}>{errorCategorias}</p>}

        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          {categorias.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              {editandoCategoria?.id === c.id ? (
                <input
                  value={editandoCategoria.name}
                  onChange={(e) => setEditandoCategoria({ ...editandoCategoria, name: e.target.value })}
                  style={{ flex: 1, marginRight: 8 }}
                />
              ) : (
                <strong>{c.name}</strong>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                {editandoCategoria?.id === c.id ? (
                  <>
                    <button type="button" onClick={handleGuardarCategoria}>Guardar</button>
                    <button type="button" className="secondary" onClick={() => setEditandoCategoria(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="secondary" onClick={() => setEditandoCategoria({ id: c.id, name: c.name })}>Editar</button>
                    <button type="button" className="secondary" onClick={() => eliminarCategoriaClick(c.id)}>Eliminar</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plantilla de factura */}
      {plantilla && (
        <div className="card">
          <h2>Plantilla de factura</h2>
          <form onSubmit={handleGuardarPlantilla}>
            <label>Nombre de la empresa</label>
            <input value={plantilla.company_name} onChange={(e) => setPlantilla({ ...plantilla, company_name: e.target.value })} required />

            <label>Eslogan</label>
            <input value={plantilla.tagline ?? ""} onChange={(e) => setPlantilla({ ...plantilla, tagline: e.target.value })} />

            <label>Correo</label>
            <input value={plantilla.email ?? ""} onChange={(e) => setPlantilla({ ...plantilla, email: e.target.value })} />

            <label>Teléfono</label>
            <input value={plantilla.phone ?? ""} onChange={(e) => setPlantilla({ ...plantilla, phone: e.target.value })} />

            <label>Dirección</label>
            <input value={plantilla.address ?? ""} onChange={(e) => setPlantilla({ ...plantilla, address: e.target.value })} />

            <label>RNC / Tax ID</label>
            <input value={plantilla.tax_id ?? ""} onChange={(e) => setPlantilla({ ...plantilla, tax_id: e.target.value })} />

            <h3 style={{ marginTop: 16 }}>Datos bancarios para pago</h3>

            <label>Banco</label>
            <input value={plantilla.bank_name ?? ""} onChange={(e) => setPlantilla({ ...plantilla, bank_name: e.target.value })} />

            <label>Número de cuenta</label>
            <input value={plantilla.bank_account ?? ""} onChange={(e) => setPlantilla({ ...plantilla, bank_account: e.target.value })} />

            <label>Titular</label>
            <input value={plantilla.bank_holder ?? ""} onChange={(e) => setPlantilla({ ...plantilla, bank_holder: e.target.value })} />

            <button type="submit" style={{ marginTop: 8 }}>Guardar plantilla</button>
          </form>
          {mensajePlantilla && <p role="status" style={{ marginTop: 8 }}>{mensajePlantilla}</p>}
          {errorPlantilla && <p role="alert" style={{ marginTop: 8 }}>{errorPlantilla}</p>}
        </div>
      )}
    </main>
  );
}
