import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("workout_completions", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable().references("id").inTable("users");
    table.string("semana_key", 20).notNullable();
    table.string("dia_id", 20).notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["user_id", "semana_key", "dia_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("workout_completions");
}
