import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("audit_log", (table) => {
    table.increments("id").primary();
    table.integer("admin_id").unsigned().notNullable().references("id").inTable("users");
    table.string("admin_nombre", 200).notNullable();
    table.string("target_type", 50).notNullable();
    table.integer("target_id").unsigned().notNullable();
    table.string("target_nombre", 200).nullable();
    table.string("accion", 50).notNullable();
    table.json("antes").nullable();
    table.json("despues").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("audit_log");
}
