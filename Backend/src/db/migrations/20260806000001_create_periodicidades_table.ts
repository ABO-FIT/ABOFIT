import type { Knex } from "knex";

const PERIODICIDADES = [
  { key: "semanal", label: "Semanal", dias: 7 },
  { key: "mensual", label: "Mensual", dias: 30 },
  { key: "trimestral", label: "Trimestral", dias: 90 },
  { key: "semestral", label: "Semestral", dias: 180 },
  { key: "anual", label: "Anual", dias: 365 },
];

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("periodicidades", (table) => {
    table.string("key", 20).primary();
    table.string("label", 30).notNullable();
    table.integer("dias").unsigned().notNullable();
  });

  await knex("periodicidades").insert(PERIODICIDADES);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("periodicidades");
}
