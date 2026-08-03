import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("invoices", (table) => {
    table.increments("id").primary();
    table.string("numero", 30).notNullable().unique();
    table.integer("order_id").unsigned().notNullable().references("id").inTable("orders");
    table.integer("user_id").unsigned().notNullable().references("id").inTable("users");
    table.integer("monto").unsigned().notNullable();
    table.enu("estado", ["pendiente", "pagada"]).notNullable().defaultTo("pendiente");
    table.date("fecha").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("invoices");
}
