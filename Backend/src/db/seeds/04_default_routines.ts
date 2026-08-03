import type { Knex } from "knex";

const ROUTINES: Record<string, unknown> = {
  masa: [
    { id: "m1", day: "Lunes", focus: "Pecho y tríceps", exercises: ["Press banca 4×8", "Press inclinado mancuerna 4×10", "Aperturas 3×12", "Fondos 3×10", "Extensión polea 3×12"] },
    { id: "m2", day: "Martes", focus: "Espalda y bíceps", exercises: ["Dominadas 4×8", "Remo barra 4×8", "Jalón al pecho 4×12", "Curl barra 4×10", "Curl martillo 3×12"] },
    { id: "m3", day: "Jueves", focus: "Pierna", exercises: ["Sentadilla 5×6", "Peso muerto rumano 4×8", "Prensa 4×12", "Extensión 3×15", "Gemelos 4×20"] },
    { id: "m4", day: "Viernes", focus: "Hombro y core", exercises: ["Press militar 4×8", "Elevaciones laterales 4×15", "Pájaros 3×15", "Plancha 3×60s", "Crunch 3×20"] },
  ],
  grasa: [
    { id: "g1", day: "Lunes", focus: "Full body + cardio", exercises: ["Sentadilla 4×12", "Press banca 4×12", "Remo 4×12", "Press militar 3×12", "15 min cardio moderado"] },
    { id: "g2", day: "Martes", focus: "HIIT y core", exercises: ["25–30 min intervalos (bici/cinta)", "Plancha 3×45s", "Elevación de piernas 3×15"] },
    { id: "g3", day: "Miércoles", focus: "Tren superior (circuito)", exercises: ["3 rondas × 15: press pecho", "remo", "press hombro", "curl + extensión", "Descanso corto entre rondas"] },
    { id: "g4", day: "Jueves", focus: "HIIT y abdomen", exercises: ["25–30 min intervalos", "Crunch 3×20", "Bicicleta 3×30s"] },
    { id: "g5", day: "Viernes", focus: "Tren inferior (circuito)", exercises: ["3 rondas × 15: zancadas", "peso muerto rumano", "prensa", "gemelos", "10 min cardio final"] },
  ],
  mantenimiento: [
    { id: "t1", day: "Lunes", focus: "Full body equilibrado", exercises: ["Sentadilla 3×10", "Press banca 3×10", "Remo 3×10", "Press hombro 3×10", "Plancha 3×45s"] },
    { id: "t2", day: "Miércoles", focus: "Movilidad y core", exercises: ["Movilidad 10 min", "Funcional con bandas 4×12", "Crunch 3×15", "Plancha lateral 3×30s"] },
    { id: "t3", day: "Viernes", focus: "Tonificación general", exercises: ["Zancadas 3×12", "Jalón al pecho 3×12", "Fondos 3×10", "Curl + extensión 3×12", "15 min cardio suave"] },
  ],
  rendimiento: [
    { id: "r1", day: "Lunes", focus: "Fuerza máxima", exercises: ["Sentadilla 5×5", "Press banca 5×5", "Remo pesado 4×6", "Dominadas lastradas 4×6"] },
    { id: "r2", day: "Martes", focus: "Potencia y pliométricos", exercises: ["Cleans 5×3", "Box jumps 5×5", "Sprints 6×40m", "Core anti-rotación 3×10"] },
    { id: "r3", day: "Jueves", focus: "Fuerza tren inferior", exercises: ["Peso muerto 5×5", "Sentadilla frontal 4×6", "Hip thrust 4×8", "Gemelos 4×12"] },
    { id: "r4", day: "Viernes", focus: "Acondicionamiento metabólico", exercises: ["AMRAP 20 min (burpees, kettlebell, remo)", "Movilidad 10 min"] },
    { id: "r5", day: "Sábado", focus: "Técnica y velocidad", exercises: ["Drills de agilidad 20 min", "Sprints en cuesta 8×30m", "Core 3×15"] },
  ],
};

export async function seed(knex: Knex): Promise<void> {
  for (const [goalKey, contenido] of Object.entries(ROUTINES)) {
    const existente = await knex("default_routines").where({ goal_key: goalKey }).first();
    if (!existente) {
      await knex("default_routines").insert({ goal_key: goalKey, contenido: JSON.stringify(contenido) });
    }
  }
}
