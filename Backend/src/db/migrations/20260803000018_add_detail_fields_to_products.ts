import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("products", (table) => {
    table.string("image_path", 255).nullable();
    table.text("beneficios").nullable();
    table.text("indicaciones").nullable();
    table.text("ingredientes").nullable();
    table.text("descripcion").nullable();
    table.text("aviso_seguridad").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("products", (table) => {
    table.dropColumn("image_path");
    table.dropColumn("beneficios");
    table.dropColumn("indicaciones");
    table.dropColumn("ingredientes");
    table.dropColumn("descripcion");
    table.dropColumn("aviso_seguridad");
  });
}
