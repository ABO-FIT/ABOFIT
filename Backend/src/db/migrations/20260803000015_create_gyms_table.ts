import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("gyms", (table) => {
    table.increments("id").primary();
    table.string("name", 150).notNullable();
    table.string("city", 100).notNullable();
    table.string("address", 255).nullable();
    table.string("phone", 30).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("gyms");
}
