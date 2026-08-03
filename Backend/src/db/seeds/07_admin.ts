import { randomBytes } from "crypto";
import type { Knex } from "knex";

const TOKEN_VIGENCIA_HORAS = 72;

export async function seed(knex: Knex): Promise<void> {
  const existente = await knex("users").where({ usuario: "admin" }).first();
  if (existente) return;

  const rol = await knex("roles").where({ nombre: "Administrador" }).first();
  if (!rol) return;

  const [userId] = await knex("users").insert({
    nombre: "Administrador",
    apellido: "ABOFIT",
    correo: "admin@abofit.do",
    usuario: "admin",
    telefono: "000-000-0000",
    password_hash: null,
    rol_id: rol.id,
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_VIGENCIA_HORAS * 60 * 60 * 1000);

  await knex("password_set_tokens").insert({ user_id: userId, token, expires_at: expiresAt });

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  console.log(`[seed:admin] Usuario "admin" creado. Definir contraseña en: ${frontendUrl}/establecer-password?token=${token}`);
}
