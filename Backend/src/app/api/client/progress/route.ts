import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

const EXTENSIONES_PERMITIDAS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const entradas = await db("progress_entries")
    .where({ user_id: sesion.userId })
    .orderBy("fecha", "desc")
    .select("id", "fecha", "peso", "cintura", "nota", "foto_path");

  return NextResponse.json({ entradas });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const pesoRaw = formData.get("peso");
  const cinturaRaw = formData.get("cintura");
  const nota = formData.get("nota");
  const foto = formData.get("foto");

  const peso = typeof pesoRaw === "string" && pesoRaw.trim() ? Number(pesoRaw) : null;
  const cintura = typeof cinturaRaw === "string" && cinturaRaw.trim() ? Number(cinturaRaw) : null;

  if (peso === null && cintura === null && !(typeof nota === "string" && nota.trim())) {
    return NextResponse.json({ error: "Registra al menos peso, cintura o una nota." }, { status: 400 });
  }

  let fotoPath: string | null = null;

  if (foto instanceof File && foto.size > 0) {
    const extension = EXTENSIONES_PERMITIDAS[foto.type];
    if (!extension) {
      return NextResponse.json({ error: "La foto debe ser JPG, PNG o WEBP." }, { status: 400 });
    }

    const directorio = path.join(process.cwd(), "public", "uploads", "progress");
    await mkdir(directorio, { recursive: true });

    const nombreArchivo = `${sesion.userId}-${randomUUID()}${extension}`;
    const bytes = Buffer.from(await foto.arrayBuffer());
    await writeFile(path.join(directorio, nombreArchivo), bytes);

    fotoPath = `/uploads/progress/${nombreArchivo}`;
  }

  const [id] = await db("progress_entries").insert({
    user_id: sesion.userId,
    fecha: new Date().toISOString().slice(0, 10),
    peso,
    cintura,
    nota: typeof nota === "string" && nota.trim() ? nota.trim() : null,
    foto_path: fotoPath,
  });

  return NextResponse.json({ id, message: "Registro de progreso guardado." }, { status: 201 });
}
