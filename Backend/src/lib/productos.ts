const OBJETIVOS_VALIDOS = ["masa", "grasa", "mantenimiento", "rendimiento"];

export interface DatosProducto {
  cat: string;
  name: string;
  price: number;
  stock: number;
  goals: string[];
  beneficios: string | null;
  indicaciones: string | null;
  ingredientes: string | null;
  descripcion: string | null;
  avisoSeguridad: string | null;
}

export function leerCamposFormulario(formData: FormData): DatosProducto | string {
  const cat = formData.get("cat");
  const name = formData.get("name");
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const goalsRaw = formData.get("goals");

  if (typeof cat !== "string" || !cat.trim() || typeof name !== "string" || !name.trim()) {
    return "Categoría y nombre son obligatorios.";
  }
  if (Number.isNaN(price) || price < 0) {
    return "El precio debe ser un número positivo.";
  }
  if (Number.isNaN(stock) || stock < 0) {
    return "El stock debe ser un número positivo.";
  }

  let goals: string[] = [];
  try {
    goals = typeof goalsRaw === "string" ? JSON.parse(goalsRaw) : [];
  } catch {
    return "Objetivos inválidos.";
  }
  if (!Array.isArray(goals) || goals.length === 0 || goals.some((g) => !OBJETIVOS_VALIDOS.includes(g))) {
    return "Debes indicar al menos un objetivo válido.";
  }

  const texto = (campo: string) => {
    const valor = formData.get(campo);
    return typeof valor === "string" && valor.trim() ? valor.trim() : null;
  };

  return {
    cat: cat.trim(),
    name: name.trim(),
    price,
    stock,
    goals,
    beneficios: texto("beneficios"),
    indicaciones: texto("indicaciones"),
    ingredientes: texto("ingredientes"),
    descripcion: texto("descripcion"),
    avisoSeguridad: texto("avisoSeguridad"),
  };
}
