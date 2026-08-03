import { db } from "@/lib/db";

export async function obtenerClienteDelEntrenador(trainerId: number, clientId: number) {
  return db("users").where({ id: clientId, trainer_id: trainerId }).first();
}
