import nodemailer from "nodemailer";
import { db } from "@/lib/db";

async function enviarCorreo(destinatario: string, asunto: string, html: string): Promise<void> {
  const config = await db("smtp_settings").first();

  if (!config?.host || !config.port || !config.usuario || !config.password) {
    console.log(`[email:sin-configurar] Enviar a ${destinatario} -> ${asunto}`);
    return;
  }

  const transportador = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: !!config.secure,
    auth: { user: config.usuario, pass: config.password },
  });

  const remitente = config.from_email ? `"${config.from_name}" <${config.from_email}>` : `"${config.from_name}" <${config.usuario}>`;

  try {
    await transportador.sendMail({
      from: remitente,
      to: destinatario,
      subject: asunto,
      html,
    });
  } catch (error) {
    console.error(`Error enviando correo a ${destinatario}:`, error);
  }
}

export async function enviarCorreoDefinirPassword(correo: string, enlace: string): Promise<void> {
  await enviarCorreo(
    correo,
    "Define tu contraseña — ABOFIT",
    `
      <p>Hola,</p>
      <p>Te invitamos a definir tu contraseña para acceder a tu cuenta de ABOFIT.</p>
      <p><a href="${enlace}">${enlace}</a></p>
      <p>Este enlace vence en 24 horas.</p>
    `,
  );
}
