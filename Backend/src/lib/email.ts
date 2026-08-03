/**
 * Envío de correo: proveedor aún no definido por el usuario.
 * Mientras tanto, el enlace se registra en el log del servidor
 * para poder continuar el flujo en desarrollo.
 * TODO: sustituir por el proveedor real (SMTP, SendGrid, Resend, SES, etc.) cuando se defina.
 */
export async function enviarCorreoDefinirPassword(correo: string, enlace: string): Promise<void> {
  console.log(`[email:pendiente-de-proveedor] Enviar a ${correo} -> ${enlace}`);
}
