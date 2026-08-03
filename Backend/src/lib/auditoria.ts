import { db } from "@/lib/db";

interface RegistrarAuditoriaParams {
  adminId: number;
  adminNombre: string;
  targetType: string;
  targetId: number;
  targetNombre?: string | null;
  accion: string;
  antes?: unknown;
  despues?: unknown;
}

export async function registrarAuditoria(params: RegistrarAuditoriaParams): Promise<void> {
  await db("audit_log").insert({
    admin_id: params.adminId,
    admin_nombre: params.adminNombre,
    target_type: params.targetType,
    target_id: params.targetId,
    target_nombre: params.targetNombre ?? null,
    accion: params.accion,
    antes: params.antes !== undefined ? JSON.stringify(params.antes) : null,
    despues: params.despues !== undefined ? JSON.stringify(params.despues) : null,
  });
}
