import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("plans", (table) => {
    table.integer("trainer_id").unsigned().nullable().references("id").inTable("users");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("plans", (table) => {
    table.dropColumn("trainer_id");
  });
}
