import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("routine_templates", (table) => {
    table.increments("id").primary();
    table.integer("trainer_id").unsigned().notNullable().references("id").inTable("users");
    table.string("nombre", 100).notNullable();
    table.json("contenido").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("routine_templates");
}
