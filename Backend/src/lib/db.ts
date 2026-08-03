import knex from "knex";
import knexConfig from "@/db/knexfile";

declare global {
  // eslint-disable-next-line no-var
  var __abofitDb: ReturnType<typeof knex> | undefined;
}

export const db = global.__abofitDb ?? knex(knexConfig);

if (process.env.NODE_ENV !== "production") {
  global.__abofitDb = db;
}
