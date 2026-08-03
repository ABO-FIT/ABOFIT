import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("plans", (table) => {
    table.string("key", 10).primary();
    table.string("name", 100).notNullable();
    table.integer("price").unsigned().notNullable();
    table.boolean("includes_diet").notNullable().defaultTo(false);
    table.text("description").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("plans");
}
