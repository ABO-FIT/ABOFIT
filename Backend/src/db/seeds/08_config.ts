import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  const plantilla = await knex("invoice_template").first();
  if (!plantilla) {
    await knex("invoice_template").insert({
      company_name: "ABOFIT",
      tagline: "Entrenamiento y suplementos por objetivo",
      email: "info@abofit.do",
      phone: "",
      address: "",
      bank_name: "",
      bank_account: "",
      bank_holder: "",
      tax_id: "",
    });
  }

  const categoriasExistentes = await knex("products").distinct("cat");
  for (const { cat } of categoriasExistentes) {
    const existe = await knex("categories").where({ name: cat }).first();
    if (!existe) {
      await knex("categories").insert({ name: cat });
    }
  }
}
