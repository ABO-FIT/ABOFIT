import { createContext, useContext, useState, type ReactNode } from "react";
import type { UsuarioSesion } from "../api/client";

interface AuthContextValue {
  token: string | null;
  usuario: UsuarioSesion | null;
  iniciarSesion: (token: string, usuario: UsuarioSesion) => void;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "abofit_token";
const USUARIO_KEY = "abofit_usuario";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => {
    const guardado = localStorage.getItem(USUARIO_KEY);
    return guardado ? (JSON.parse(guardado) as UsuarioSesion) : null;
  });

  function iniciarSesion(nuevoToken: string, nuevoUsuario: UsuarioSesion) {
    localStorage.setItem(TOKEN_KEY, nuevoToken);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(nuevoUsuario));
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  }

  function cerrarSesion() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ token, usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }
  return context;
}
