import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("payments", (table) => {
    table.string("comprobante_path", 255).nullable();
    table.date("periodo_inicio").nullable();
    table.date("periodo_fin").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("payments", (table) => {
    table.dropColumn("comprobante_path");
    table.dropColumn("periodo_inicio");
    table.dropColumn("periodo_fin");
  });
}
