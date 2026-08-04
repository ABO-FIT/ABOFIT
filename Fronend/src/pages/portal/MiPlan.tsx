import { useEffect, useState, type ReactNode } from "react";
import { money } from "../../lib/money";
import { agregarAlCarrito, obtenerCatalogo, obtenerMiPlan, type MiPlanRespuesta, type Producto } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import ProductModal from "../../components/ProductModal";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function SeccionDesplegable({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "transparent",
          color: "var(--text)",
          padding: 0,
          fontFamily: "var(--disp)",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {titulo}
        <span style={{ fontSize: 14, color: "var(--muted)" }}>{abierto ? "▲ Ocultar" : "▼ Ver"}</span>
      </button>
      {abierto && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}

export default function MiPlan() {
  const { token } = useAuth();
  const [datos, setDatos] = useState<MiPlanRespuesta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recomendados, setRecomendados] = useState<Producto[]>([]);
  const [productoAbierto, setProductoAbierto] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerMiPlan(token)
      .then(setDatos)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar tu plan."));
  }, [token]);

  useEffect(() => {
    if (!datos || !datos.asignado || !datos.goal) return;
    obtenerCatalogo(token, { goal: datos.goal.key })
      .then(({ productos }) => setRecomendados(productos.filter((p) => p.stock > 0).slice(0, 3)))
      .catch(() => {});
  }, [datos, token]);

  if (error) {
    return (
      <main className="wide">
        <p role="alert">{error}</p>
      </main>
    );
  }

  if (!datos) {
    return (
      <main className="wide">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!datos.asignado) {
    return (
      <main className="wide">
        <span className="eyebrow">Tu suscripción</span>
        <h1>Mi plan</h1>
        <p>Aún no tienes un plan asignado. Tu entrenador lo asignará próximamente.</p>
      </main>
    );
  }

  const { plan, goal, rutina, dieta, caloriasObjetivo, proteinaObjetivoG } = datos;

  async function handleAgregar(productId: number) {
    if (!token) return;
    setMensaje(null);
    try {
      await agregarAlCarrito(token, productId);
      setMensaje("Producto agregado al carrito.");
      setProductoAbierto(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  return (
    <main className="wide">
      <span className="eyebrow">Tu suscripción</span>
      <h1>Mi plan</h1>

      {plan && (
        <div className="card" style={{ background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className={`tag ${plan.key === "B" ? "b" : "a"}`}>{plan.name}</span>
            {goal && (
              <span className="tag" style={{ background: goal.color, color: "#fff" }}>
                {goal.shortLabel}
              </span>
            )}
          </div>
          <h2 style={{ fontFamily: "var(--disp)", fontSize: 26, margin: "12px 0 6px", color: "#fff" }}>{plan.name}</h2>
          <p style={{ color: "#aeb4c0", margin: 0, lineHeight: 1.6 }}>{plan.description}</p>
          {goal && <div style={{ color: "#cfd4dd", marginTop: 10, fontSize: 13 }}>Objetivo: {goal.label}</div>}
          <div style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: 34, color: "#fff", marginTop: 16 }}>
            {money(plan.price)}
            <span style={{ fontSize: 14, color: "#8b92a0", fontWeight: 500 }}> / mes</span>
          </div>
        </div>
      )}

      {(caloriasObjetivo || proteinaObjetivoG) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
          {caloriasObjetivo && (
            <div className="card" style={{ flex: "1 1 160px", minWidth: 160 }}>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Calorías diarias objetivo</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 24 }}>{caloriasObjetivo} kcal</p>
            </div>
          )}
          {proteinaObjetivoG && (
            <div className="card" style={{ flex: "1 1 160px", minWidth: 160 }}>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Proteína diaria objetivo</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 24 }}>{proteinaObjetivoG} g</p>
            </div>
          )}
        </div>
      )}

      {mensaje && <p role="status">{mensaje}</p>}

      {recomendados.length > 0 && (
        <>
          <h2 style={{ marginTop: 24 }}>Recomendado para tu objetivo</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {recomendados.map((producto) => (
              <button key={producto.id} type="button" className="product-card" onClick={() => setProductoAbierto(producto.id)}>
                <div
                  className="product-image"
                  style={producto.images[0] ? { backgroundImage: `url(${API_URL}${producto.images[0]})` } : undefined}
                >
                  {!producto.images[0] && producto.cat}
                  {producto.images.length > 1 && (
                    <span style={{ position: "absolute", bottom: 7, right: 8, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20 }}>
                      +{producto.images.length - 1}
                    </span>
                  )}
                </div>
                <div className="product-body">
                  {producto.recomendado && (
                    <span className="tag" style={{ background: "var(--oks)", color: "var(--ok)", marginBottom: 6 }}>
                      Recomendado
                    </span>
                  )}
                  <h3 style={{ margin: "4px 0", fontSize: 16 }}>{producto.name}</h3>
                  <p style={{ color: "var(--accent2)", fontWeight: 700, fontSize: 18, margin: 0 }}>{money(producto.price)}</p>
                  <div className="product-tags">
                    {producto.goals.map((g) => (
                      <span key={g} className="tag">{g}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {productoAbierto && (
        <ProductModal productId={productoAbierto} onClose={() => setProductoAbierto(null)} onAgregar={handleAgregar} />
      )}

      <SeccionDesplegable titulo="Rutina semanal">
        <div style={{ display: "grid", gap: 12 }}>
          {rutina.map((dia) => (
            <div key={dia.id} className="card">
              <strong>
                {dia.day} — {dia.focus}
              </strong>
              <ul>
                {dia.exercises.map((ejercicio) => (
                  <li key={ejercicio}>{ejercicio}</li>
                ))}
              </ul>
            </div>
          ))}
          {rutina.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no tienes una rutina asignada.</p>}
        </div>
      </SeccionDesplegable>

      {dieta && (
        <SeccionDesplegable titulo="Plan de alimentación">
          <p style={{ color: "var(--muted)" }}>{dieta.nota}</p>
          <div style={{ display: "grid", gap: 8 }}>
            {dieta.comidas.map((comida) => (
              <div key={comida.meal} className="card">
                <strong>{comida.meal}</strong>
                <p>{comida.items}</p>
              </div>
            ))}
          </div>
        </SeccionDesplegable>
      )}
    </main>
  );
}
