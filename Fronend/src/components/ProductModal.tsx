import { useEffect, useState } from "react";
import { obtenerProducto, type ProductoDetalle } from "../api/client";
import { money } from "../lib/money";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const PESTANAS = [
  { key: "beneficios", label: "Beneficios", icono: "✨" },
  { key: "indicaciones", label: "Indicaciones", icono: "📋" },
  { key: "ingredientes", label: "Ingredientes", icono: "🥣" },
  { key: "descripcion", label: "Descripción", icono: "📄" },
  { key: "avisoSeguridad", label: "Aviso de Seguridad", icono: "⚠️" },
] as const;

type ClavePestana = (typeof PESTANAS)[number]["key"];

function ContenidoLista({ texto }: { texto: string | null }) {
  if (!texto) {
    return <p style={{ color: "var(--muted)" }}>Sin información disponible.</p>;
  }
  const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <ul>
      {lineas.map((linea, i) => (
        <li key={i}>{linea}</li>
      ))}
    </ul>
  );
}

export default function ProductModal({
  productId,
  onClose,
  onAgregar,
}: {
  productId: number;
  onClose: () => void;
  onAgregar?: (id: number) => void;
}) {
  const [producto, setProducto] = useState<ProductoDetalle | null>(null);
  const [pestana, setPestana] = useState<ClavePestana>("beneficios");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerProducto(productId)
      .then(({ producto }) => setProducto(producto))
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el producto."));
  }, [productId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        {error && <p role="alert">{error}</p>}

        {!producto && !error && <p>Cargando...</p>}

        {producto && (
          <>
            <div
              className="product-image"
              style={{
                height: 160,
                borderRadius: 8,
                backgroundImage: producto.imagePath ? `url(${API_URL}${producto.imagePath})` : undefined,
              }}
            >
              {!producto.imagePath && producto.cat}
            </div>

            <h2 style={{ marginTop: 16 }}>{producto.name}</h2>
            <p style={{ color: "var(--accent2)", fontWeight: 700, fontSize: 20, margin: 0 }}>{money(producto.price)}</p>
            <div className="product-tags" style={{ marginTop: 8 }}>
              {producto.goals.map((g) => (
                <span key={g} className="tag" style={{ background: "var(--line)" }}>
                  {g}
                </span>
              ))}
            </div>

            <div className="modal-tabs">
              {PESTANAS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={pestana === p.key ? "active" : ""}
                  onClick={() => setPestana(p.key)}
                >
                  {p.icono} {p.label}
                </button>
              ))}
            </div>

            <div>
              {pestana === "descripcion" ? (
                <p style={{ whiteSpace: "pre-wrap" }}>{producto.descripcion ?? "Sin descripción disponible."}</p>
              ) : (
                <ContenidoLista texto={producto[pestana]} />
              )}
            </div>

            {onAgregar && (
              <button type="button" style={{ marginTop: 16 }} onClick={() => onAgregar(producto.id)}>
                Agregar al carrito
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
