import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const gimnasios = await db("gyms").select("id", "name", "city", "address", "phone").orderBy("name", "asc");
  return NextResponse.json({ gimnasios });
}

export async function POST(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { name, city, address, phone } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim() || typeof city !== "string" || !city.trim()) {
    return NextResponse.json({ error: "Nombre y ciudad son obligatorios." }, { status: 400 });
  }

  const [id] = await db("gyms").insert({
    name: name.trim(),
    city: city.trim(),
    address: typeof address === "string" ? address.trim() : null,
    phone: typeof phone === "string" ? phone.trim() : null,
  });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "gimnasio",
    targetId: id,
    targetNombre: name,
    accion: "crear",
    despues: { name, city, address, phone },
  });

  return NextResponse.json({ id, message: "Gimnasio creado correctamente." }, { status: 201 });
}
