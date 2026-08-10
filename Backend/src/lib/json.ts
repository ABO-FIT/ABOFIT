export function parsearJson<T>(valor: unknown): T {
  return typeof valor === "string" ? (JSON.parse(valor) as T) : (valor as T);
}

export function parsearJsonSeguro<T>(valor: unknown, valorPorDefecto: T): T {
  try {
    return parsearJson<T>(valor);
  } catch {
    return valorPorDefecto;
  }
}
