import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("default_routines", (table) => {
    table.string("goal_key", 30).primary();
    table.json("contenido").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("default_routines");
}
