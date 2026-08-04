import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RutaProtegida({ children, rol }: { children: ReactNode; rol?: string }) {
  const { token, usuario } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (rol && usuario?.rol !== rol) {
    if (usuario?.rol === "Cliente") {
      return <Navigate to="/portal" replace />;
    }
    if (usuario?.rol === "Entrenador") {
      return <Navigate to="/entrenador" replace />;
    }
    if (usuario?.rol === "Administrador") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
