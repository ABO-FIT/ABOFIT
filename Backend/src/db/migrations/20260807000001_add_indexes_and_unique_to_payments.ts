import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("payments", (table) => {
    table.unique(["client_id", "periodo_inicio", "periodo_fin"], { indexName: "payments_periodo_unico" });
    table.index(["client_id", "estado"], "payments_client_estado_idx");
    table.index(["client_id", "periodo_fin"], "payments_client_periodo_fin_idx");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("payments", (table) => {
    table.dropUnique(["client_id", "periodo_inicio", "periodo_fin"], "payments_periodo_unico");
    table.dropIndex(["client_id", "estado"], "payments_client_estado_idx");
    table.dropIndex(["client_id", "periodo_fin"], "payments_client_periodo_fin_idx");
  });
}
