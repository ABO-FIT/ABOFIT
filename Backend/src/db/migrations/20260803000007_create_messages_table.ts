import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("messages", (table) => {
    table.increments("id").primary();
    table.integer("client_id").unsigned().notNullable().references("id").inTable("users");
    table.enu("remitente", ["cliente", "entrenador"]).notNullable();
    table.text("texto").notNullable();
    table.boolean("leido").notNullable().defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("messages");
}
