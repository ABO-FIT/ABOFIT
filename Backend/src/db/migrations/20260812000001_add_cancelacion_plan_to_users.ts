import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.timestamp("plan_cancelado_en").nullable();
    table.date("plan_vigente_hasta").nullable();
    table.enu("plan_cancelado_por", ["cliente", "entrenador"]).nullable();
    table.text("plan_cancelado_motivo").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("plan_cancelado_en");
    table.dropColumn("plan_vigente_hasta");
    table.dropColumn("plan_cancelado_por");
    table.dropColumn("plan_cancelado_motivo");
  });
}
