import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("default_diets", (table) => {
    table.string("goal_key", 30).primary();
    table.text("nota").notNullable();
    table.json("comidas").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("default_diets");
}
