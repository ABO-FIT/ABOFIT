import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { obtenerCarrito } from "../api/client";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  cantidad: number;
  refrescarCarrito: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, usuario } = useAuth();
  const [cantidad, setCantidad] = useState(0);

  function refrescarCarrito() {
    if (!token || (usuario?.rol !== "Cliente" && usuario?.rol !== "Entrenador")) {
      setCantidad(0);
      return;
    }
    obtenerCarrito(token)
      .then(({ items }) => setCantidad(items.reduce((suma, item) => suma + item.qty, 0)))
      .catch(() => {});
  }

  useEffect(refrescarCarrito, [token, usuario?.rol]);

  return <CartContext.Provider value={{ cantidad, refrescarCarrito }}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider.");
  }
  return context;
}
