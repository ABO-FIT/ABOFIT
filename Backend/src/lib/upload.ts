import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const EXTENSIONES_PERMITIDAS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function extensionValida(tipo: string): string | null {
  return EXTENSIONES_PERMITIDAS[tipo] ?? null;
}

export async function guardarImagen(archivo: File, carpeta: string, prefijo: string): Promise<string> {
  const extension = extensionValida(archivo.type);
  if (!extension) {
    throw new Error("La imagen debe ser JPG, PNG o WEBP.");
  }

  const directorio = path.join(process.cwd(), "public", "uploads", carpeta);
  await mkdir(directorio, { recursive: true });

  const nombreArchivo = `${prefijo}-${randomUUID()}${extension}`;
  const bytes = Buffer.from(await archivo.arrayBuffer());
  await writeFile(path.join(directorio, nombreArchivo), bytes);

  return `/uploads/${carpeta}/${nombreArchivo}`;
}

export async function eliminarImagen(rutaPublica: string | null | undefined): Promise<void> {
  if (!rutaPublica) return;
  const rutaAbsoluta = path.join(process.cwd(), "public", rutaPublica);
  await unlink(rutaAbsoluta).catch(() => {});
}
