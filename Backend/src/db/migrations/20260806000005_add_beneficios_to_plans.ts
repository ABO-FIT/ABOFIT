import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("plans", (table) => {
    table.text("beneficios").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("plans", (table) => {
    table.dropColumn("beneficios");
  });
}
