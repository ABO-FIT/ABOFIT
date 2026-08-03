export function money(n: number): string {
  return "RD$" + Number(n).toLocaleString("es-DO");
}
