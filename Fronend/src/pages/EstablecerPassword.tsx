import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { establecerPassword } from "../api/client";
import AuthLayout from "../components/AuthLayout";

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
    <AuthLayout>
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

        <button type="submit" className="block" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>

      {mensaje && <p role="status" style={{ marginTop: 12 }}>{mensaje}</p>}
      {error && <p role="alert" style={{ marginTop: 12 }}>{error}</p>}

      <div className="auth-links" style={{ justifyContent: "center" }}>
        <Link to="/login">Volver a iniciar sesión</Link>
      </div>
    </AuthLayout>
  );
}
