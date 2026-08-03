import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("goals", (table) => {
    table.string("key", 30).primary();
    table.string("label", 100).notNullable();
    table.string("short_label", 60).notNullable();
    table.string("color", 10).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("goals");
}
