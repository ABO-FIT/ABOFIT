import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const plantilla = await db("invoice_template").first();
  return NextResponse.json({ plantilla });
}

export async function PUT(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const anterior = await db("invoice_template").first();
  if (!anterior) {
    return NextResponse.json({ error: "No se encontró la plantilla." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const { companyName, tagline, email, phone, address, bankName, bankAccount, bankHolder, taxId } = (body ?? {}) as Record<string, unknown>;

  if (typeof companyName !== "string" || !companyName.trim()) {
    return NextResponse.json({ error: "El nombre de la empresa es obligatorio." }, { status: 400 });
  }

  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const despues = {
    company_name: companyName.trim(),
    tagline: texto(tagline),
    email: texto(email),
    phone: texto(phone),
    address: texto(address),
    bank_name: texto(bankName),
    bank_account: texto(bankAccount),
    bank_holder: texto(bankHolder),
    tax_id: texto(taxId),
  };

  await db("invoice_template").where({ id: anterior.id }).update(despues);

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "plantilla_factura",
    targetId: anterior.id,
    targetNombre: despues.company_name,
    accion: "editar",
    antes: anterior,
    despues,
  });

  return NextResponse.json({ message: "Plantilla de factura actualizada correctamente." });
}
