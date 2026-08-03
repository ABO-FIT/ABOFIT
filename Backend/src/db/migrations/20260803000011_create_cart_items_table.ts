import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("cart_items", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable().references("id").inTable("users");
    table.integer("product_id").unsigned().notNullable().references("id").inTable("products");
    table.integer("qty").unsigned().notNullable().defaultTo(1);
    table.timestamps(true, true);
    table.unique(["user_id", "product_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("cart_items");
}
