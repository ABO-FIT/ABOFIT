import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { iniciarSesion as iniciarSesionApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/brand/logo-onlight.png";

export default function Login() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();

  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const respuesta = await iniciarSesionApi(identificador, password);
      iniciarSesion(respuesta.token, respuesta.usuario);
      navigate("/perfil");
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
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="identificador">Usuario o correo</label>
        <input
          id="identificador"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={enviando}>
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      <p style={{ marginTop: 16, fontSize: 14 }}>
        <Link to="/olvide-password">¿Olvidaste tu contraseña?</Link>
      </p>
      <p style={{ marginTop: 8, fontSize: 14 }}>
        ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </main>
  );
}
