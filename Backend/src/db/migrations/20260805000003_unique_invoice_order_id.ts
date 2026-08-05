import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("invoices", (table) => {
    table.unique("order_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("invoices", (table) => {
    table.dropUnique(["order_id"]);
  });
}
