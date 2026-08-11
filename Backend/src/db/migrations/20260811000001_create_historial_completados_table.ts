import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("historial_completados", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable().references("id").inTable("users");
    table.enu("tipo", ["rutina", "dieta"]).notNullable();
    table.date("fecha").notNullable();
    table.string("referencia", 100).notNullable();
    table.string("etiqueta", 255).notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["user_id", "tipo", "fecha", "referencia"]);
    table.index(["user_id", "tipo", "fecha"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("historial_completados");
}
