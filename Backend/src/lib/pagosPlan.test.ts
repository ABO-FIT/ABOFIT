import { beforeEach, describe, expect, it, vi } from "vitest";

interface FilaPorTabla {
  [tabla: string]: unknown[];
}

let colas: FilaPorTabla = {};
let contadores: Record<string, number> = {};
let insertsCapturados: { tabla: string; datos: unknown }[] = [];

function siguienteFila(tabla: string): unknown {
  const cola = colas[tabla] ?? [];
  const idx = contadores[tabla] ?? 0;
  contadores[tabla] = idx + 1;
  return cola[idx] ?? null;
}

function crearBuilder(tabla: string) {
  const builder = {
    where: () => builder,
    andWhere: () => builder,
    whereNotNull: () => builder,
    orderBy: () => builder,
    forUpdate: () => builder,
    first: () => Promise.resolve(siguienteFila(tabla)),
    insert: (datos: unknown) => {
      insertsCapturados.push({ tabla, datos });
      return Promise.resolve([999]);
    },
  };
  return builder;
}

function crearDbFalso() {
  const fn = vi.fn((tabla: string) => crearBuilder(tabla)) as unknown as {
    (tabla: string): ReturnType<typeof crearBuilder>;
    transaction: (callback: (trx: (tabla: string) => ReturnType<typeof crearBuilder>) => Promise<unknown>) => Promise<unknown>;
  };
  fn.transaction = (callback) => callback((tabla: string) => crearBuilder(tabla));
  return fn;
}

vi.mock("@/lib/db", () => ({
  db: crearDbFalso(),
}));

beforeEach(() => {
  colas = {};
  contadores = {};
  insertsCapturados = [];
});

describe("obtenerOCrearPagoPendiente", () => {
  it("devuelve el pago pendiente existente sin crear uno nuevo", async () => {
    const { obtenerOCrearPagoPendiente } = await import("./pagosPlan");

    colas.payments = [
      { id: 1, monto: 8000, concepto: "Mensualidad Plan A", fecha: "2026-08-01", estado: "pendiente", comprobante_path: null },
    ];

    const resultado = await obtenerOCrearPagoPendiente(2);

    expect(resultado).toEqual({
      alDia: false,
      vigenciaHasta: null,
      creado: false,
      pago: { id: 1, monto: 8000, concepto: "Mensualidad Plan A", fecha: "2026-08-01", estado: "pendiente", comprobantePath: null },
    });
    expect(insertsCapturados).toHaveLength(0);
  });

  it("devuelve null si el cliente no tiene plan o entrenador asignado", async () => {
    const { obtenerOCrearPagoPendiente } = await import("./pagosPlan");

    colas.payments = [null];
    colas.users = [{ plan_key: null, trainer_id: null }, { plan_key: null, trainer_id: null }];

    const resultado = await obtenerOCrearPagoPendiente(2);

    expect(resultado).toBeNull();
  });

  it("está al día cuando el último pago pagado aún no vence", async () => {
    const { obtenerOCrearPagoPendiente } = await import("./pagosPlan");

    const manana = new Date();
    manana.setDate(manana.getDate() + 10);
    const vigenciaHasta = manana.toISOString().slice(0, 10);

    colas.payments = [null, { estado: "pagado", periodo_fin: vigenciaHasta }];
    colas.users = [{ plan_key: "A", trainer_id: 5, fecha_inicio: null }, { plan_key: "A", trainer_id: 5, fecha_inicio: null }];
    colas.plans = [{ key: "A", periodicidad_key: "mensual", price: 8000, name: "Plan A" }];
    colas.periodicidades = [{ key: "mensual", dias: 30, label: "Mensual" }];

    const resultado = await obtenerOCrearPagoPendiente(2);

    expect(resultado).toEqual({ alDia: true, vigenciaHasta, creado: false, pago: null });
    expect(insertsCapturados).toHaveLength(0);
  });

  it("genera el siguiente cobro un día después de vencido el período anterior", async () => {
    const { obtenerOCrearPagoPendiente } = await import("./pagosPlan");

    colas.payments = [
      null,
      { estado: "pagado", periodo_fin: "2026-07-01" },
      { id: 999, monto: 8000, concepto: "Mensualidad Mensual — Plan A", fecha: "2026-08-07", estado: "pendiente", periodo_inicio: "2026-07-02", periodo_fin: "2026-07-31", comprobante_path: null },
    ];
    colas.users = [{ plan_key: "A", trainer_id: 5, fecha_inicio: null }, { plan_key: "A", trainer_id: 5, fecha_inicio: null }];
    colas.plans = [{ key: "A", periodicidad_key: "mensual", price: 8000, name: "Plan A" }];
    colas.periodicidades = [{ key: "mensual", dias: 30, label: "Mensual" }];

    const resultado = await obtenerOCrearPagoPendiente(2);

    expect(resultado?.creado).toBe(true);
    expect(insertsCapturados).toHaveLength(1);
    const insertado = insertsCapturados[0].datos as Record<string, unknown>;
    expect(insertado.periodo_inicio).toBe("2026-07-02");
    expect(insertado.periodo_fin).toBe("2026-07-31");
    expect(insertado.trainer_id).toBe(5);
    expect(insertado.monto).toBe(8000);
  });
});
