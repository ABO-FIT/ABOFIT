import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { solicitarRecuperarPassword } from "../api/client";
import AuthLayout from "../components/AuthLayout";

export default function OlvidePassword() {
  const [identificador, setIdentificador] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMensaje(null);
    setEnviando(true);

    try {
      const respuesta = await solicitarRecuperarPassword(identificador);
      setMensaje(respuesta.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Recuperar contraseña</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="identificador">Usuario o correo</label>
        <input
          id="identificador"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          required
        />

        <button type="submit" className="block" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar enlace"}
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
