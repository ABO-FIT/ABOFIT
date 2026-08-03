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
    table.string("goal_key", 30).nullable();
    table.string("plan_key", 10).nullable();
    table.decimal("peso", 6, 2).nullable();
    table.enu("peso_unidad", ["kg", "lb"]).notNullable().defaultTo("kg");
    table.decimal("altura", 6, 2).nullable();
    table.enu("altura_unidad", ["cm", "ft"]).notNullable().defaultTo("cm");
    table.integer("edad").unsigned().nullable();
    table.enu("sexo", ["male", "female"]).nullable();
    table.string("nivel_actividad", 30).nullable();
    table.decimal("cintura", 6, 2).nullable();
    table.decimal("cadera", 6, 2).nullable();
    table.integer("presion_sistolica").unsigned().nullable();
    table.integer("presion_diastolica").unsigned().nullable();
    table.date("fecha_inicio").nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
