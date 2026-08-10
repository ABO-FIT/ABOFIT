import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const config = await db("smtp_settings").first();

  return NextResponse.json({
    config: config
      ? {
          host: config.host,
          port: config.port,
          secure: !!config.secure,
          usuario: config.usuario,
          fromEmail: config.from_email,
          fromName: config.from_name,
          passwordConfigurada: !!config.password,
        }
      : null,
  });
}

export async function PUT(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const anterior = await db("smtp_settings").first();
  if (!anterior) {
    return NextResponse.json({ error: "No se encontró la configuración." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const { host, port, secure, usuario, password, fromEmail, fromName } = (body ?? {}) as Record<string, unknown>;

  if (typeof fromName !== "string" || !fromName.trim()) {
    return NextResponse.json({ error: "El nombre del remitente es obligatorio." }, { status: 400 });
  }
  if (port !== undefined && port !== null && port !== "" && (typeof port !== "number" || !Number.isInteger(port) || port <= 0 || port > 65535)) {
    return NextResponse.json({ error: "El puerto debe ser un número válido." }, { status: 400 });
  }
  if (typeof fromEmail === "string" && fromEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail.trim())) {
    return NextResponse.json({ error: "El correo remitente no tiene un formato válido." }, { status: 400 });
  }

  const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  const despues: Record<string, unknown> = {
    host: texto(host),
    port: typeof port === "number" ? port : null,
    secure: !!secure,
    usuario: texto(usuario),
    from_email: texto(fromEmail),
    from_name: fromName.trim(),
  };

  // La contraseña solo se sobrescribe si se envía un valor nuevo; un campo
  // vacío significa "mantener la contraseña actual" (nunca se muestra en el GET).
  if (typeof password === "string" && password.trim()) {
    despues.password = password.trim();
  }

  await db("smtp_settings").where({ id: anterior.id }).update(despues);

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "smtp_settings",
    targetId: anterior.id,
    targetNombre: "Configuración SMTP",
    accion: "editar",
    antes: { ...anterior, password: anterior.password ? "***" : null },
    despues: { ...despues, password: despues.password ? "***" : undefined },
  });

  return NextResponse.json({ message: "Configuración SMTP actualizada correctamente." });
}
