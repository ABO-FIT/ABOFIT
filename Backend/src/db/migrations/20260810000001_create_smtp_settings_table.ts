import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("smtp_settings", (table) => {
    table.increments("id").primary();
    table.string("host", 150).nullable();
    table.integer("port").unsigned().nullable();
    table.boolean("secure").notNullable().defaultTo(false);
    table.string("usuario", 150).nullable();
    table.string("password", 255).nullable();
    table.string("from_email", 150).nullable();
    table.string("from_name", 100).notNullable().defaultTo("ABOFIT");
    table.timestamps(true, true);
  });

  await knex("smtp_settings").insert({ from_name: "ABOFIT" });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("smtp_settings");
}
