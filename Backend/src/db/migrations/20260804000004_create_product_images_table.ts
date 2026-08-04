import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("product_images", (table) => {
    table.increments("id").primary();
    table.integer("product_id").unsigned().notNullable().references("id").inTable("products").onDelete("CASCADE");
    table.string("path", 255).notNullable();
    table.integer("position").unsigned().notNullable().defaultTo(0);
  });

  const productos = await knex("products").whereNotNull("image_path").select("id", "image_path");
  for (const producto of productos) {
    await knex("product_images").insert({ product_id: producto.id, path: producto.image_path, position: 0 });
  }

  await knex.schema.alterTable("products", (table) => {
    table.dropColumn("image_path");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("products", (table) => {
    table.string("image_path", 255).nullable();
  });

  const primeras = await knex("product_images").where({ position: 0 });
  for (const img of primeras) {
    await knex("products").where({ id: img.product_id }).update({ image_path: img.path });
  }

  await knex.schema.dropTableIfExists("product_images");
}
