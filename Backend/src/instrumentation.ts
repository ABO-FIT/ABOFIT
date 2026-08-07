export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { iniciarProgramador } = await import("@/lib/scheduler");
    iniciarProgramador();
  }
}
