import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("progress_entries", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable().references("id").inTable("users");
    table.date("fecha").notNullable();
    table.decimal("peso", 6, 2).nullable();
    table.decimal("cintura", 6, 2).nullable();
    table.text("nota").nullable();
    table.string("foto_path", 255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("progress_entries");
}
