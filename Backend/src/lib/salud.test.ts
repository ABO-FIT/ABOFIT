import { describe, expect, it } from "vitest";
import { calcularSalud, detectarAdvertenciaObjetivo, libraAKg, piesAcm, type DatosSalud } from "./salud";

const BASE: DatosSalud = {
  pesoKg: 80,
  alturaCm: 180,
  edad: 30,
  sexo: "male",
  nivelActividad: "moderado",
  cintura: null,
  cadera: null,
  presionSistolica: null,
  presionDiastolica: null,
  goalKey: "mantenimiento",
  porcentajeGrasa: null,
  porcentajeMasaMuscular: null,
};

describe("conversiones de unidades", () => {
  it("convierte libras a kilogramos", () => {
    expect(libraAKg(220)).toBeCloseTo(99.79, 1);
  });

  it("convierte pies a centímetros", () => {
    expect(piesAcm(6)).toBeCloseTo(182.88, 1);
  });
});

describe("calcularSalud", () => {
  it("usa Mifflin-St Jeor cuando no hay porcentaje de grasa/masa muscular", () => {
    const resultado = calcularSalud(BASE);
    expect(resultado.formulaCalorica).toBe("mifflin_st_jeor");
    expect(resultado.masaMagraKg).toBeNull();
  });

  it("usa Katch-McArdle cuando hay porcentaje de grasa corporal", () => {
    const resultado = calcularSalud({ ...BASE, porcentajeGrasa: 20 });
    expect(resultado.formulaCalorica).toBe("katch_mcardle");
    expect(resultado.masaGrasaKg).toBe(16);
    expect(resultado.masaMagraKg).toBe(64);
  });

  it("calcula IMC y su clasificación", () => {
    const resultado = calcularSalud(BASE);
    expect(resultado.imc).toBeCloseTo(24.7, 1);
    expect(resultado.imcClasificacion).toBe("Normal");
  });

  it("aplica superávit calórico para objetivo de masa muscular", () => {
    const mantenimiento = calcularSalud({ ...BASE, goalKey: "mantenimiento" });
    const masa = calcularSalud({ ...BASE, goalKey: "masa" });
    expect(masa.caloriasObjetivo!).toBeGreaterThan(mantenimiento.caloriasObjetivo!);
  });

  it("aplica déficit calórico para objetivo de pérdida de grasa", () => {
    const mantenimiento = calcularSalud({ ...BASE, goalKey: "mantenimiento" });
    const grasa = calcularSalud({ ...BASE, goalKey: "grasa" });
    expect(grasa.caloriasObjetivo!).toBeLessThan(mantenimiento.caloriasObjetivo!);
  });

  it("no calcula calorías si falta un dato requerido", () => {
    const resultado = calcularSalud({ ...BASE, nivelActividad: null });
    expect(resultado.caloriasObjetivo).toBeNull();
  });

  it("clasifica la presión arterial", () => {
    const resultado = calcularSalud({ ...BASE, presionSistolica: 145, presionDiastolica: 95 });
    expect(resultado.presionClasificacion).toBe("Hipertensión etapa 2");
  });

  it("clasifica el índice cintura-cadera", () => {
    const resultado = calcularSalud({ ...BASE, cintura: 85, cadera: 100 });
    expect(resultado.iccClasificacion).toBe("Riesgo bajo");
  });
});

describe("detectarAdvertenciaObjetivo", () => {
  it("advierte si el objetivo es masa muscular pero el IMC indica obesidad", () => {
    const advertencia = detectarAdvertenciaObjetivo("Obesidad", "masa");
    expect(advertencia).not.toBeNull();
  });

  it("advierte si el objetivo es pérdida de grasa pero el IMC indica bajo peso", () => {
    const advertencia = detectarAdvertenciaObjetivo("Bajo peso", "grasa");
    expect(advertencia).not.toBeNull();
  });

  it("no advierte cuando el objetivo es coherente con el IMC", () => {
    expect(detectarAdvertenciaObjetivo("Normal", "masa")).toBeNull();
    expect(detectarAdvertenciaObjetivo(null, "masa")).toBeNull();
    expect(detectarAdvertenciaObjetivo("Obesidad", null)).toBeNull();
  });
});
