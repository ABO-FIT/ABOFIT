import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("invoice_template", (table) => {
    table.increments("id").primary();
    table.string("company_name", 150).notNullable().defaultTo("ABOFIT");
    table.string("tagline", 200).nullable();
    table.string("email", 150).nullable();
    table.string("phone", 30).nullable();
    table.string("address", 255).nullable();
    table.string("bank_name", 100).nullable();
    table.string("bank_account", 50).nullable();
    table.string("bank_holder", 150).nullable();
    table.string("tax_id", 30).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("invoice_template");
}
