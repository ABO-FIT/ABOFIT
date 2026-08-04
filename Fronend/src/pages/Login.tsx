import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { iniciarSesion as iniciarSesionApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

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
      if (respuesta.usuario.rol === "Cliente") {
        navigate("/portal/mi-plan");
      } else if (respuesta.usuario.rol === "Entrenador") {
        navigate("/entrenador/panel");
      } else if (respuesta.usuario.rol === "Administrador") {
        navigate("/admin/panel");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="sr-only">Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="identificador">Usuario o correo</label>
          <input
            id="identificador"
            className="inp"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            className="inp"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="block" disabled={enviando}>
          {enviando ? "Ingresando..." : "Entrar"}
        </button>
      </form>

      {error && <p role="alert" style={{ marginTop: 12 }}>{error}</p>}

      <div className="auth-links">
        <Link to="/olvide-password">¿Olvidaste tu contraseña?</Link>
        <Link to="/registro">Crear cuenta</Link>
      </div>
    </AuthLayout>
  );
}
