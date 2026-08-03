export function claveSemanaActual(): string {
  const ahora = new Date();
  const inicioAno = new Date(Date.UTC(ahora.getUTCFullYear(), 0, 1));
  const dias = Math.floor((ahora.getTime() - inicioAno.getTime()) / 86400000);
  const semana = Math.ceil((dias + inicioAno.getUTCDay() + 1) / 7);
  return `${ahora.getUTCFullYear()}-S${String(semana).padStart(2, "0")}`;
}
