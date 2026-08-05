import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("orders", (table) => {
    table.string("comprobante_path", 255).nullable();
  });

  await knex.schema.alterTable("invoices", (table) => {
    table.dropColumn("comprobante_path");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("invoices", (table) => {
    table.string("comprobante_path", 255).nullable();
  });

  await knex.schema.alterTable("orders", (table) => {
    table.dropColumn("comprobante_path");
  });
}
