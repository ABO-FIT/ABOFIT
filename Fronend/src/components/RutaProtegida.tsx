import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RutaProtegida({ children, rol }: { children: ReactNode; rol?: string }) {
  const { token, usuario } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (rol && usuario?.rol !== rol) {
    return <Navigate to="/perfil" replace />;
  }

  return <>{children}</>;
}
