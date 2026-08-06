import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("plans", (table) => {
    table.string("periodicidad_key", 20).notNullable().defaultTo("mensual").references("key").inTable("periodicidades");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("plans", (table) => {
    table.dropColumn("periodicidad_key");
  });
}
