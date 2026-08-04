import { useEffect, useState, type FormEvent } from "react";
import { actualizarPlantillaFactura, obtenerPlantillaFactura, type PlantillaFactura } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

export default function ConfigPlantillaFactura() {
  const { token } = useAuth();

  const [plantilla, setPlantilla] = useState<PlantillaFactura | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    obtenerPlantillaFactura(token).then(({ plantilla }) => setPlantilla(plantilla)).catch(() => {});
  }, [token]);

  async function handleGuardar(event: FormEvent) {
    event.preventDefault();
    if (!token || !plantilla) return;
    setError(null);
    setMensaje(null);
    try {
      const respuesta = await actualizarPlantillaFactura(token, {
        companyName: plantilla.company_name,
        tagline: plantilla.tagline ?? "",
        email: plantilla.email ?? "",
        phone: plantilla.phone ?? "",
        address: plantilla.address ?? "",
        bankName: plantilla.bank_name ?? "",
        bankAccount: plantilla.bank_account ?? "",
        bankHolder: plantilla.bank_holder ?? "",
        taxId: plantilla.tax_id ?? "",
      });
      setMensaje(respuesta.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  if (!plantilla) {
    return (
      <main className="wide">
        <span className="eyebrow">Configuración</span>
        <h1>Plantillas de facturas</h1>
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="wide">
      <span className="eyebrow">Configuración</span>
      <h1>Plantillas de facturas</h1>

      <div className="card">
        <form onSubmit={handleGuardar}>
          <label>Nombre de la empresa</label>
          <input value={plantilla.company_name} onChange={(e) => setPlantilla({ ...plantilla, company_name: e.target.value })} required />

          <label>Eslogan</label>
          <input value={plantilla.tagline ?? ""} onChange={(e) => setPlantilla({ ...plantilla, tagline: e.target.value })} />

          <label>Correo</label>
          <input value={plantilla.email ?? ""} onChange={(e) => setPlantilla({ ...plantilla, email: e.target.value })} />

          <label>Teléfono</label>
          <input value={plantilla.phone ?? ""} onChange={(e) => setPlantilla({ ...plantilla, phone: e.target.value })} />

          <label>Dirección</label>
          <input value={plantilla.address ?? ""} onChange={(e) => setPlantilla({ ...plantilla, address: e.target.value })} />

          <label>RNC / Tax ID</label>
          <input value={plantilla.tax_id ?? ""} onChange={(e) => setPlantilla({ ...plantilla, tax_id: e.target.value })} />

          <h3 style={{ marginTop: 16 }}>Datos bancarios para pago</h3>

          <label>Banco</label>
          <input value={plantilla.bank_name ?? ""} onChange={(e) => setPlantilla({ ...plantilla, bank_name: e.target.value })} />

          <label>Número de cuenta</label>
          <input value={plantilla.bank_account ?? ""} onChange={(e) => setPlantilla({ ...plantilla, bank_account: e.target.value })} />

          <label>Titular</label>
          <input value={plantilla.bank_holder ?? ""} onChange={(e) => setPlantilla({ ...plantilla, bank_holder: e.target.value })} />

          <button type="submit" style={{ marginTop: 8 }}>Guardar plantilla</button>
        </form>
        {mensaje && <p role="status" style={{ marginTop: 8 }}>{mensaje}</p>}
        {error && <p role="alert" style={{ marginTop: 8 }}>{error}</p>}
      </div>
    </main>
  );
}
