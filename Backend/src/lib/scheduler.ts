import cron from "node-cron";
import { db } from "@/lib/db";
import { obtenerOCrearPagoPendiente } from "@/lib/pagosPlan";
import { calcularAlertasEntrenador } from "@/lib/alertas";
import { crearNotificacion } from "@/lib/notificaciones";

const DIAS_SIN_REPETIR_ALERTA = 7;

export interface ResumenTareasProgramadas {
  cobrosGenerados: number;
  alertasNotificadas: number;
}

async function generarCobrosVencidos(): Promise<number> {
  const clientes = await db("users")
    .whereNotNull("trainer_id")
    .whereNotNull("plan_key")
    .select("id");

  let cobrosGenerados = 0;

  for (const cliente of clientes) {
    const resultado = await obtenerOCrearPagoPendiente(cliente.id);
    if (resultado?.creado && resultado.pago) {
      await crearNotificacion({
        userId: cliente.id,
        tipo: "pago",
        titulo: `Nuevo cobro disponible: ${resultado.pago.concepto}`,
        subtitulo: `Monto: RD$${resultado.pago.monto.toLocaleString("es-DO")}`,
        link: "/portal/pagos",
      });
      cobrosGenerados += 1;
    }
  }

  return cobrosGenerados;
}

async function notificarAlertasEntrenadores(): Promise<number> {
  const entrenadores = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("roles.nombre", "Entrenador")
    .select("users.id");

  const desde = new Date();
  desde.setDate(desde.getDate() - DIAS_SIN_REPETIR_ALERTA);

  let alertasNotificadas = 0;

  for (const entrenador of entrenadores) {
    const alertas = await calcularAlertasEntrenador(entrenador.id);

    for (const alerta of alertas) {
      const link = `/entrenador/clientes/${alerta.clienteId}`;
      const yaNotificada = await db("notifications")
        .where({ user_id: entrenador.id, tipo: "alerta", link })
        .andWhere("created_at", ">=", desde)
        .first();

      if (yaNotificada) continue;

      await crearNotificacion({
        userId: entrenador.id,
        tipo: "alerta",
        titulo: `Atención con ${alerta.nombre}`,
        subtitulo: alerta.motivos[0],
        link,
      });
      alertasNotificadas += 1;
    }
  }

  return alertasNotificadas;
}

export async function ejecutarTareasProgramadas(): Promise<ResumenTareasProgramadas> {
  const cobrosGenerados = await generarCobrosVencidos();
  const alertasNotificadas = await notificarAlertasEntrenadores();
  return { cobrosGenerados, alertasNotificadas };
}

let programadorIniciado = false;

export function iniciarProgramador(): void {
  if (programadorIniciado) return;
  programadorIniciado = true;

  cron.schedule("0 8 * * *", () => {
    ejecutarTareasProgramadas().catch((error) => {
      console.error("Error ejecutando tareas programadas:", error);
    });
  });
}
