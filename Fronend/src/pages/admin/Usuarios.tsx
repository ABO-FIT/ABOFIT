import { useEffect, useState, type FormEvent } from "react";
import {
  cambiarEstadoUsuario,
  cambiarRolUsuario,
  crearUsuarioAdmin,
  editarUsuarioAdmin,
  obtenerUsuarios,
  type NuevoUsuarioAdminPayload,
  type UsuarioAdmin,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const ROLES = ["Administrador", "Entrenador", "Cliente"];

const NUEVO_INICIAL: NuevoUsuarioAdminPayload = {
  nombre: "", apellido: "", correo: "", usuario: "", telefono: "", rol: "Cliente",
};

export default function Usuarios() {
  const { token, usuario: sesion } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [filtroRol, setFiltroRol] = useState("");
  const [buscar, setBuscar] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [nuevo, setNuevo] = useState<NuevoUsuarioAdminPayload>(NUEVO_INICIAL);
  const [mensajeNuevo, setMensajeNuevo] = useState<string | null>(null);
  const [enlaceNuevo, setEnlaceNuevo] = useState<string | null>(null);
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);
  const [formEdicion, setFormEdicion] = useState({ nombre: "", apellido: "", correo: "", telefono: "" });

  function cargar() {
    if (!token) return;
    obtenerUsuarios(token, { rol: filtroRol || undefined, buscar: buscar || undefined })
      .then(({ usuarios }) => setUsuarios(usuarios))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios."));
  }

  useEffect(cargar, [token, filtroRol]);

  async function handleCrear(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setErrorNuevo(null);
    setMensajeNuevo(null);
    setEnlaceNuevo(null);
    setGuardando(true);
    try {
      const respuesta = await crearUsuarioAdmin(token, nuevo);
      setMensajeNuevo(respuesta.message);
      setEnlaceNuevo(respuesta.enlace);
      setNuevo(NUEVO_INICIAL);
      cargar();
    } catch (err) {
      setErrorNuevo(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  }

  async function copiarEnlace(enlace: string) {
    try {
      await navigator.clipboard.writeText(enlace);
      setMensajeNuevo("Enlace copiado al portapapeles.");
    } catch {
      // Si el navegador no permite copiar, el enlace igual queda visible para copiarlo a mano.
    }
  }

  async function handleToggleEstado(u: UsuarioAdmin) {
    if (!token) return;
    await cambiarEstadoUsuario(token, u.id, !u.activo);
    cargar();
  }

  async function handleCambiarRol(u: UsuarioAdmin, rol: string) {
    if (!token || rol === u.rol) return;
    await cambiarRolUsuario(token, u.id, rol);
    cargar();
  }

  function abrirEdicion(u: UsuarioAdmin) {
    setEditando(u);
    setFormEdicion({ nombre: u.nombre, apellido: u.apellido, correo: u.correo, telefono: "" });
  }

  async function handleGuardarEdicion(event: FormEvent) {
    event.preventDefault();
    if (!token || !editando) return;
    await editarUsuarioAdmin(token, editando.id, formEdicion);
    setEditando(null);
    cargar();
  }

  return (
    <main className="wide">
      <h1>Usuarios</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input placeholder="Buscar..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="button" onClick={cargar}>Buscar</button>
        <button type="button" className="secondary" onClick={() => setMostrarNuevo((v) => !v)}>Crear usuario</button>
      </div>

      {mostrarNuevo && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Crear usuario</h3>
          <form onSubmit={handleCrear}>
            <label>Nombre</label>
            <input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} required />
            <label>Apellido</label>
            <input value={nuevo.apellido} onChange={(e) => setNuevo({ ...nuevo, apellido: e.target.value })} required />
            <label>Correo</label>
            <input type="email" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} required />
            <label>Usuario</label>
            <input value={nuevo.usuario} onChange={(e) => setNuevo({ ...nuevo, usuario: e.target.value })} required />
            <label>Teléfono</label>
            <input value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} required />
            <label>Rol</label>
            <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="submit" disabled={guardando}>{guardando ? "Creando..." : "Crear usuario"}</button>
          </form>
          {mensajeNuevo && <p role="status">{mensajeNuevo}</p>}
          {enlaceNuevo && (
            <div className="card" style={{ marginTop: 8, background: "var(--bg)" }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
                Si el correo no llega (SMTP no configurado, va a spam, etc.), comparte este enlace directamente con el usuario para que pueda definir su contraseña:
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <code style={{ fontSize: 12, wordBreak: "break-all" }}>{enlaceNuevo}</code>
                <button type="button" className="secondary" onClick={() => copiarEnlace(enlaceNuevo)}>Copiar enlace</button>
              </div>
            </div>
          )}
          {errorNuevo && <p role="alert">{errorNuevo}</p>}
        </div>
      )}

      {editando && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Editar {editando.nombre} {editando.apellido}</h3>
          <form onSubmit={handleGuardarEdicion}>
            <label>Nombre</label>
            <input value={formEdicion.nombre} onChange={(e) => setFormEdicion({ ...formEdicion, nombre: e.target.value })} required />
            <label>Apellido</label>
            <input value={formEdicion.apellido} onChange={(e) => setFormEdicion({ ...formEdicion, apellido: e.target.value })} required />
            <label>Correo</label>
            <input type="email" value={formEdicion.correo} onChange={(e) => setFormEdicion({ ...formEdicion, correo: e.target.value })} required />
            <label>Teléfono</label>
            <input value={formEdicion.telefono} onChange={(e) => setFormEdicion({ ...formEdicion, telefono: e.target.value })} required />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit">Guardar</button>
              <button type="button" className="secondary" onClick={() => setEditando(null)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {error && <p role="alert">{error}</p>}

      <div style={{ display: "grid", gap: 8 }}>
        {usuarios.map((u) => (
          <div key={u.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <strong>{u.nombre} {u.apellido}</strong>
              <p style={{ margin: 0, color: "var(--muted)" }}>@{u.usuario} · {u.correo}</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={u.rol} onChange={(e) => handleCambiarRol(u, e.target.value)} disabled={u.id === sesion?.id}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="tag" style={{ background: u.activo ? "var(--oks)" : "var(--danger-bg)", color: u.activo ? "var(--ok)" : "var(--danger)" }}>
                {u.activo ? "Activo" : "Inactivo"}
              </span>
              <button type="button" className="secondary" onClick={() => abrirEdicion(u)}>Editar</button>
              <button type="button" className="secondary" onClick={() => handleToggleEstado(u)} disabled={u.id === sesion?.id}>
                {u.activo ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
        {usuarios.length === 0 && <p style={{ color: "var(--muted)" }}>Sin resultados.</p>}
      </div>
    </main>
  );
}
