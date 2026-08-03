const FACTOR_ACTIVIDAD: Record<string, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

const AJUSTE_OBJETIVO: Record<string, number> = {
  masa: 0.15,
  grasa: -0.2,
  mantenimiento: 0,
  rendimiento: 0.05,
};

const PROTEINA_G_POR_KG: Record<string, number> = {
  masa: 2.0,
  grasa: 2.0,
  mantenimiento: 1.6,
  rendimiento: 1.8,
};

export interface DatosSalud {
  pesoKg: number | null;
  alturaCm: number | null;
  edad: number | null;
  sexo: "male" | "female" | null;
  nivelActividad: string | null;
  cintura: number | null;
  cadera: number | null;
  presionSistolica: number | null;
  presionDiastolica: number | null;
  goalKey: string | null;
}

export function libraAKg(lb: number): number {
  return lb * 0.453592;
}

export function piesAcm(ft: number): number {
  return ft * 30.48;
}

function clasificarImc(imc: number): string {
  if (imc < 18.5) return "Bajo peso";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidad";
}

function clasificarIcc(icc: number, sexo: "male" | "female"): string {
  if (sexo === "male") {
    if (icc < 0.9) return "Riesgo bajo";
    if (icc < 1.0) return "Riesgo moderado";
    return "Riesgo alto";
  }
  if (icc < 0.8) return "Riesgo bajo";
  if (icc < 0.85) return "Riesgo moderado";
  return "Riesgo alto";
}

function clasificarPresion(sistolica: number, diastolica: number): string {
  if (sistolica > 180 || diastolica > 120) return "Crisis hipertensiva";
  if (sistolica >= 140 || diastolica >= 90) return "Hipertensión etapa 2";
  if (sistolica >= 130 || diastolica >= 80) return "Hipertensión etapa 1";
  if (sistolica >= 120) return "Elevada";
  return "Normal";
}

export interface ResultadoSalud {
  imc: number | null;
  imcClasificacion: string | null;
  icc: number | null;
  iccClasificacion: string | null;
  presionClasificacion: string | null;
  caloriasObjetivo: number | null;
  proteinaObjetivoG: number | null;
}

export function calcularSalud(datos: DatosSalud): ResultadoSalud {
  const resultado: ResultadoSalud = {
    imc: null,
    imcClasificacion: null,
    icc: null,
    iccClasificacion: null,
    presionClasificacion: null,
    caloriasObjetivo: null,
    proteinaObjetivoG: null,
  };

  const { pesoKg, alturaCm, edad, sexo, nivelActividad, cintura, cadera, presionSistolica, presionDiastolica, goalKey } = datos;

  if (pesoKg && alturaCm) {
    const alturaM = alturaCm / 100;
    resultado.imc = Number((pesoKg / (alturaM * alturaM)).toFixed(1));
    resultado.imcClasificacion = clasificarImc(resultado.imc);
  }

  if (cintura && cadera && sexo) {
    resultado.icc = Number((cintura / cadera).toFixed(2));
    resultado.iccClasificacion = clasificarIcc(resultado.icc, sexo);
  }

  if (presionSistolica && presionDiastolica) {
    resultado.presionClasificacion = clasificarPresion(presionSistolica, presionDiastolica);
  }

  if (pesoKg && alturaCm && edad && sexo && nivelActividad && FACTOR_ACTIVIDAD[nivelActividad]) {
    const tmb = sexo === "male"
      ? 10 * pesoKg + 6.25 * alturaCm - 5 * edad + 5
      : 10 * pesoKg + 6.25 * alturaCm - 5 * edad - 161;

    const mantenimiento = tmb * FACTOR_ACTIVIDAD[nivelActividad];
    const ajuste = goalKey ? AJUSTE_OBJETIVO[goalKey] ?? 0 : 0;
    resultado.caloriasObjetivo = Math.round(mantenimiento * (1 + ajuste));

    const gPorKg = goalKey ? PROTEINA_G_POR_KG[goalKey] ?? 1.6 : 1.6;
    resultado.proteinaObjetivoG = Math.round(pesoKg * gPorKg);
  }

  return resultado;
}
