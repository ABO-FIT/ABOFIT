import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { agregarAlCarrito, obtenerCarrito, type Producto } from "../api/client";
import { useAuth } from "./AuthContext";

export interface ItemCarritoLocal {
  productId: number;
  qty: number;
  name: string;
  price: number;
  cat: string;
  stock: number;
  images: string[];
}

interface CartContextValue {
  cantidad: number;
  refrescarCarrito: () => void;
  carritoLocal: ItemCarritoLocal[];
  agregarLocal: (producto: Producto, qty?: number) => void;
  actualizarCantidadLocal: (productId: number, qty: number) => void;
  quitarLocal: (productId: number) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CARRITO_LOCAL_KEY = "abofit_carrito_local";

function leerCarritoLocal(): ItemCarritoLocal[] {
  try {
    const guardado = localStorage.getItem(CARRITO_LOCAL_KEY);
    return guardado ? (JSON.parse(guardado) as ItemCarritoLocal[]) : [];
  } catch {
    return [];
  }
}

function guardarCarritoLocal(items: ItemCarritoLocal[]) {
  localStorage.setItem(CARRITO_LOCAL_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, usuario } = useAuth();
  const [cantidad, setCantidad] = useState(0);
  const [carritoLocal, setCarritoLocal] = useState<ItemCarritoLocal[]>(() => leerCarritoLocal());

  function refrescarCarrito() {
    if (!token || (usuario?.rol !== "Cliente" && usuario?.rol !== "Entrenador")) {
      setCantidad(carritoLocal.reduce((suma, item) => suma + item.qty, 0));
      return;
    }
    obtenerCarrito(token)
      .then(({ items }) => setCantidad(items.reduce((suma, item) => suma + item.qty, 0)))
      .catch(() => {});
  }

  useEffect(refrescarCarrito, [token, usuario?.rol]);

  // Al iniciar sesión, si había productos agregados al carrito sin cuenta,
  // se trasladan al carrito real del usuario y se limpia el carrito local.
  useEffect(() => {
    if (!token || (usuario?.rol !== "Cliente" && usuario?.rol !== "Entrenador")) return;

    const pendientes = leerCarritoLocal();
    if (pendientes.length === 0) return;

    (async () => {
      for (const item of pendientes) {
        try {
          await agregarAlCarrito(token, item.productId, item.qty);
        } catch {
          // Si un producto ya no existe o no tiene stock, se omite y se sigue con el resto.
        }
      }
      localStorage.removeItem(CARRITO_LOCAL_KEY);
      setCarritoLocal([]);
      refrescarCarrito();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, usuario?.rol]);

  function agregarLocal(producto: Producto, qty = 1) {
    setCarritoLocal((actual) => {
      const existente = actual.find((i) => i.productId === producto.id);
      let nuevo: ItemCarritoLocal[];
      if (existente) {
        nuevo = actual.map((i) => (i.productId === producto.id ? { ...i, qty: Math.min(i.qty + qty, producto.stock) } : i));
      } else {
        nuevo = [
          ...actual,
          { productId: producto.id, qty: Math.min(qty, producto.stock), name: producto.name, price: producto.price, cat: producto.cat, stock: producto.stock, images: producto.images },
        ];
      }
      guardarCarritoLocal(nuevo);
      return nuevo;
    });
  }

  function actualizarCantidadLocal(productId: number, qty: number) {
    setCarritoLocal((actual) => {
      const nuevo = actual.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i));
      guardarCarritoLocal(nuevo);
      return nuevo;
    });
  }

  function quitarLocal(productId: number) {
    setCarritoLocal((actual) => {
      const nuevo = actual.filter((i) => i.productId !== productId);
      guardarCarritoLocal(nuevo);
      return nuevo;
    });
  }

  useEffect(() => {
    if (!token) setCantidad(carritoLocal.reduce((suma, item) => suma + item.qty, 0));
  }, [carritoLocal, token]);

  return (
    <CartContext.Provider value={{ cantidad, refrescarCarrito, carritoLocal, agregarLocal, actualizarCantidadLocal, quitarLocal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider.");
  }
  return context;
}
