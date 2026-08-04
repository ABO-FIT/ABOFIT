import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("payments", (table) => {
    table.increments("id").primary();
    table.integer("client_id").unsigned().notNullable().references("id").inTable("users");
    table.integer("trainer_id").unsigned().notNullable().references("id").inTable("users");
    table.integer("monto").unsigned().notNullable();
    table.string("concepto", 150).notNullable();
    table.date("fecha").notNullable();
    table.enu("estado", ["pagado", "pendiente"]).notNullable().defaultTo("pendiente");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("payments");
}
