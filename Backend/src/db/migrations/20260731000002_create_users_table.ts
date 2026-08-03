import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("nombre", 100).notNullable();
    table.string("apellido", 100).notNullable();
    table.string("correo", 150).notNullable().unique();
    table.string("usuario", 100).notNullable().unique();
    table.string("password_hash", 255).nullable();
    table.integer("rol_id").unsigned().notNullable().references("id").inTable("roles");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
