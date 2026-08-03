import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("custom_routines", (table) => {
    table.integer("user_id").unsigned().primary().references("id").inTable("users");
    table.json("contenido").notNullable();
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("custom_routines");
}
