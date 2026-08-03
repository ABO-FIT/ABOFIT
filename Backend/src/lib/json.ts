export function parsearJson<T>(valor: unknown): T {
  return typeof valor === "string" ? (JSON.parse(valor) as T) : (valor as T);
}
