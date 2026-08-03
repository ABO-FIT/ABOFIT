import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("order_items", (table) => {
    table.increments("id").primary();
    table.integer("order_id").unsigned().notNullable().references("id").inTable("orders");
    table.integer("product_id").unsigned().nullable().references("id").inTable("products");
    table.string("name", 150).notNullable();
    table.integer("price").unsigned().notNullable();
    table.integer("qty").unsigned().notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("order_items");
}
