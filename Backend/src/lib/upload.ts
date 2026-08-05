import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_ENTRADA_BYTES = 15 * 1024 * 1024;

export function esImagenValida(tipo: string): boolean {
  return TIPOS_PERMITIDOS.has(tipo);
}

async function comprimirImagen(entrada: Buffer, mimeType: string): Promise<{ buffer: Buffer; extension: string }> {
  const formato = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpeg";
  const base = sharp(entrada).rotate();

  let calidad = 85;
  let salida: Buffer;

  do {
    salida = await (formato === "png"
      ? base.clone().png({ quality: calidad, compressionLevel: 9 })
      : formato === "webp"
        ? base.clone().webp({ quality: calidad })
        : base.clone().jpeg({ quality: calidad })
    ).toBuffer();
    calidad -= 15;
  } while (salida.length > MAX_BYTES && calidad > 20);

  if (salida.length > MAX_BYTES) {
    const metadata = await base.metadata();
    const anchoActual = metadata.width ?? 1600;
    salida = await base
      .clone()
      .resize({ width: Math.min(anchoActual, 1400), withoutEnlargement: true })
      .jpeg({ quality: 65 })
      .toBuffer();
    return { buffer: salida, extension: ".jpg" };
  }

  const extension = formato === "png" ? ".png" : formato === "webp" ? ".webp" : ".jpg";
  return { buffer: salida, extension };
}

export async function guardarImagen(archivo: File, carpeta: string, prefijo: string): Promise<string> {
  if (!esImagenValida(archivo.type)) {
    throw new Error("Solo se permiten imágenes JPG, PNG o WEBP.");
  }

  if (archivo.size > MAX_ENTRADA_BYTES) {
    throw new Error("La imagen es demasiado grande (máximo 15 MB).");
  }

  const entrada = Buffer.from(await archivo.arrayBuffer());

  try {
    await sharp(entrada).metadata();
  } catch {
    throw new Error("El archivo no es una imagen válida.");
  }

  const { buffer, extension } = await comprimirImagen(entrada, archivo.type);

  const directorio = path.join(process.cwd(), "public", "uploads", carpeta);
  await mkdir(directorio, { recursive: true });

  const nombreArchivo = `${prefijo}-${randomUUID()}${extension}`;
  await writeFile(path.join(directorio, nombreArchivo), buffer);

  return `/uploads/${carpeta}/${nombreArchivo}`;
}

export async function eliminarImagen(rutaPublica: string | null | undefined): Promise<void> {
  if (!rutaPublica) return;
  const rutaAbsoluta = path.join(process.cwd(), "public", rutaPublica);
  await unlink(rutaAbsoluta).catch(() => {});
}
