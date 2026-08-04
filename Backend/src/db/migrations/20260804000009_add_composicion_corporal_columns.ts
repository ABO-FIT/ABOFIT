import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.decimal("porcentaje_grasa", 5, 2).nullable();
    table.decimal("porcentaje_masa_muscular", 5, 2).nullable();
  });

  await knex.schema.alterTable("client_evaluations", (table) => {
    table.decimal("porcentaje_grasa", 5, 2).nullable();
    table.decimal("porcentaje_masa_muscular", 5, 2).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("porcentaje_grasa");
    table.dropColumn("porcentaje_masa_muscular");
  });

  await knex.schema.alterTable("client_evaluations", (table) => {
    table.dropColumn("porcentaje_grasa");
    table.dropColumn("porcentaje_masa_muscular");
  });
}
