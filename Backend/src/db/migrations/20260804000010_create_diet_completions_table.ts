import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("diet_completions", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable().references("id").inTable("users");
    table.date("fecha").notNullable();
    table.string("meal", 100).notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["user_id", "fecha", "meal"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("diet_completions");
}
