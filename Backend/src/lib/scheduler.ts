import cron from "node-cron";
import { db } from "@/lib/db";
import { obtenerOCrearPagoPendiente } from "@/lib/pagosPlan";
import { calcularAlertasEntrenador } from "@/lib/alertas";
import { crearNotificacion } from "@/lib/notificaciones";

const DIAS_SIN_REPETIR_ALERTA = 7;

export interface ResumenTareasProgramadas {
  cobrosGenerados: number;
  alertasNotificadas: number;
  omitido?: boolean;
}

function formatoFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

async function generarCobrosVencidos(): Promise<number> {
  const clientes = await db("users")
    .whereNotNull("trainer_id")
    .whereNotNull("plan_key")
    .select("id");

  let cobrosGenerados = 0;

  for (const cliente of clientes) {
    try {
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
    } catch (error) {
      console.error(`Error generando cobro para el cliente ${cliente.id}:`, error);
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
    try {
      const alertas = await calcularAlertasEntrenador(entrenador.id);

      for (const alerta of alertas) {
        const link = `/entrenador/clientes/${alerta.clienteId}`;
        const subtitulo = alerta.motivos.join(" · ");

        const ultimaNotificacion = await db("notifications")
          .where({ user_id: entrenador.id, tipo: "alerta", link })
          .andWhere("created_at", ">=", desde)
          .orderBy("created_at", "desc")
          .first();

        if (ultimaNotificacion && ultimaNotificacion.subtitulo === subtitulo) continue;

        await crearNotificacion({
          userId: entrenador.id,
          tipo: "alerta",
          titulo: `Atención con ${alerta.nombre}`,
          subtitulo,
          link,
        });
        alertasNotificadas += 1;
      }
    } catch (error) {
      console.error(`Error calculando alertas para el entrenador ${entrenador.id}:`, error);
    }
  }

  return alertasNotificadas;
}

/**
 * Intenta reservar la ejecución diaria insertando la fecha de hoy en
 * scheduler_runs (columna única). Si otra instancia del proceso ya la
 * reservó, el insert falla y esta instancia se abstiene de correr las
 * tareas, evitando cobros/alertas duplicados en despliegues con más de
 * un proceso Node corriendo el mismo cron.
 */
async function reclamarEjecucionDiaria(): Promise<boolean> {
  try {
    await db("scheduler_runs").insert({ run_date: formatoFecha(new Date()) });
    return true;
  } catch {
    return false;
  }
}

async function marcarEjecucionDeHoy(): Promise<void> {
  try {
    await db("scheduler_runs").insert({ run_date: formatoFecha(new Date()) });
  } catch {
    // Ya estaba marcada (ej. el cron ya corrió hoy) — no es un error.
  }
}

export async function ejecutarTareasProgramadas(opciones: { forzar?: boolean } = {}): Promise<ResumenTareasProgramadas> {
  if (opciones.forzar) {
    await marcarEjecucionDeHoy();
  } else {
    const reservado = await reclamarEjecucionDiaria();
    if (!reservado) {
      return { cobrosGenerados: 0, alertasNotificadas: 0, omitido: true };
    }
  }

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
