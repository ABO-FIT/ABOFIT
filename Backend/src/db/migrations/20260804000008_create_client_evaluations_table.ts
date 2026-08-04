import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("client_evaluations", (table) => {
    table.increments("id").primary();
    table.integer("client_id").unsigned().notNullable().references("id").inTable("users");
    table.integer("trainer_id").unsigned().notNullable().references("id").inTable("users");
    table.decimal("peso", 6, 2).nullable();
    table.enu("peso_unidad", ["kg", "lb"]).defaultTo("kg");
    table.decimal("altura", 6, 2).nullable();
    table.enu("altura_unidad", ["cm", "ft"]).defaultTo("cm");
    table.integer("edad").unsigned().nullable();
    table.enu("sexo", ["male", "female"]).nullable();
    table.string("nivel_actividad", 30).nullable();
    table.decimal("cintura", 6, 2).nullable();
    table.decimal("cadera", 6, 2).nullable();
    table.integer("presion_sistolica").unsigned().nullable();
    table.integer("presion_diastolica").unsigned().nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("client_evaluations");
}
