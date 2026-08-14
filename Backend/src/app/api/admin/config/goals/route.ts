import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

const KEY_REGEX = /^[a-z0-9_]{2,30}$/;

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const goals = await db("goals").select("key", "label", "short_label", "color").orderBy("label", "asc");
  return NextResponse.json({ goals });
}

export async function POST(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { key, label, shortLabel, color } = (body ?? {}) as Record<string, unknown>;

  if (typeof key !== "string" || !KEY_REGEX.test(key)) {
    return NextResponse.json({ error: "La clave debe tener 2-30 caracteres en minúsculas, números o guión bajo." }, { status: 400 });
  }
  if (typeof label !== "string" || !label.trim() || typeof shortLabel !== "string" || !shortLabel.trim() || typeof color !== "string" || !color.trim()) {
    return NextResponse.json({ error: "Nombre, nombre corto y color son obligatorios." }, { status: 400 });
  }

  const existente = await db("goals").where({ key }).first();
  if (existente) {
    return NextResponse.json({ error: "Ya existe un objetivo con esa clave." }, { status: 409 });
  }

  await db("goals").insert({ key, label: label.trim(), short_label: shortLabel.trim(), color: color.trim() });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "objetivo",
    targetId: 0,
    targetNombre: label,
    accion: "crear",
    despues: { key, label, shortLabel, color },
  });

  return NextResponse.json({ message: "Objetivo creado. Recuerda definirle una rutina y dieta por defecto si aplica." }, { status: 201 });
}
