import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { establecerPassword } from "../api/client";
import logo from "../assets/brand/logo-onlight.png";

export default function EstablecerPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMensaje(null);

    if (!token) {
      setError("El enlace no incluye un token válido.");
      return;
    }

    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await establecerPassword(token, password);
      setMensaje(respuesta.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main>
      <div className="brand">
        <img src={logo} alt="ABOFIT" />
      </div>
      <h1>Definir contraseña</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label htmlFor="confirmacion">Confirmar contraseña</label>
        <input
          id="confirmacion"
          type="password"
          minLength={8}
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          required
        />

        <button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>

      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p role="alert">{error}</p>}

      <p style={{ marginTop: 16, fontSize: 14 }}>
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </main>
  );
}
