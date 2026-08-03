import type { Knex } from "knex";

const PRODUCTS = [
  { cat: "Proteínas", name: "Whey Protein 2 lb", price: 3200, goals: ["masa", "mantenimiento", "rendimiento", "grasa"] },
  { cat: "Proteínas", name: "Iso Whey 2 lb", price: 3900, goals: ["grasa", "mantenimiento", "rendimiento"] },
  { cat: "Proteínas", name: "Mass Gainer 5 lb", price: 4500, goals: ["masa"] },
  { cat: "Creatina", name: "Creatina Monohidratada 300g", price: 1800, goals: ["masa", "rendimiento", "mantenimiento"] },
  { cat: "Creatina", name: "Creatina HCL 250g", price: 2100, goals: ["masa", "rendimiento"] },
  { cat: "Creatina", name: "Creatina + Beta-Alanina", price: 2400, goals: ["masa", "rendimiento"] },
  { cat: "Pre-entreno", name: "Pre-Workout 30 serv.", price: 2600, goals: ["masa", "rendimiento", "grasa"] },
  { cat: "Pre-entreno", name: "Pump sin estimulante", price: 2300, goals: ["masa", "mantenimiento", "rendimiento"] },
  { cat: "Pre-entreno", name: "Energy Shot (caja)", price: 1500, goals: ["rendimiento", "grasa"] },
  { cat: "Aminoácidos", name: "BCAA 2:1:1 300g", price: 1900, goals: ["masa", "grasa", "rendimiento"] },
  { cat: "Aminoácidos", name: "EAA 300g", price: 2200, goals: ["masa", "grasa", "rendimiento", "mantenimiento"] },
  { cat: "Aminoácidos", name: "Glutamina 300g", price: 1600, goals: ["rendimiento", "mantenimiento"] },
  { cat: "Vitaminas y salud", name: "Multivitamínico 90 caps", price: 1400, goals: ["masa", "grasa", "mantenimiento", "rendimiento"] },
  { cat: "Vitaminas y salud", name: "Omega 3 90 caps", price: 1300, goals: ["masa", "grasa", "mantenimiento", "rendimiento"] },
  { cat: "Vitaminas y salud", name: "Vitamina D3 + K2", price: 1200, goals: ["masa", "grasa", "mantenimiento", "rendimiento"] },
  { cat: "Quemadores", name: "Termogénico 60 caps", price: 2000, goals: ["grasa"] },
  { cat: "Quemadores", name: "L-Carnitina líquida", price: 1700, goals: ["grasa", "rendimiento"] },
  { cat: "Quemadores", name: "CLA 90 caps", price: 1800, goals: ["grasa"] },
];

export async function seed(knex: Knex): Promise<void> {
  const existentes = await knex("products").count("id as total").first<{ total: number } | undefined>();
  if (Number(existentes?.total ?? 0) > 0) return;

  for (const producto of PRODUCTS) {
    await knex("products").insert({ ...producto, goals: JSON.stringify(producto.goals), stock: 50 });
  }
}
