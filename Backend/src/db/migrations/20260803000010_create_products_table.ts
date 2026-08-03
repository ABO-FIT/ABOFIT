import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("products", (table) => {
    table.increments("id").primary();
    table.string("cat", 60).notNullable();
    table.string("name", 150).notNullable();
    table.integer("price").unsigned().notNullable();
    table.json("goals").notNullable();
    table.integer("stock").unsigned().notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("products");
}
