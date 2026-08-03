import { db } from "@/lib/db";

interface CrearNotificacionParams {
  userId: number;
  tipo: string;
  titulo: string;
  subtitulo?: string | null;
  link?: string | null;
}

export async function crearNotificacion(params: CrearNotificacionParams): Promise<void> {
  await db("notifications").insert({
    user_id: params.userId,
    tipo: params.tipo,
    titulo: params.titulo,
    subtitulo: params.subtitulo ?? null,
    link: params.link ?? null,
  });
}
