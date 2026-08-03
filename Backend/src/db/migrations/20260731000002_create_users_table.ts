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
    table.string("telefono", 30).nullable();
    table.string("especialidad", 150).nullable();
    table.text("bio").nullable();
    table.string("bank_name", 100).nullable();
    table.string("bank_account", 50).nullable();
    table.string("bank_holder", 150).nullable();
    table.string("pay_phone", 30).nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
