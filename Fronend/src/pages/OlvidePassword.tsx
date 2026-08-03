import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { solicitarRecuperarPassword } from "../api/client";
import logo from "../assets/brand/logo-onlight.png";

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
    <main>
      <div className="brand">
        <img src={logo} alt="ABOFIT" />
      </div>
      <h1>Recuperar contraseña</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="identificador">Usuario o correo</label>
        <input
          id="identificador"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          required
        />

        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar enlace"}
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
