import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("notifications", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable().references("id").inTable("users");
    table.string("tipo", 40).notNullable();
    table.string("titulo", 150).notNullable();
    table.string("subtitulo", 255).nullable();
    table.string("link", 255).nullable();
    table.boolean("leido").notNullable().defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("notifications");
}
