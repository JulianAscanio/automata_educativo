import { TrazaRegistro } from "./types";

export class PedagogicalTracer {
  public titulo: string;
  public registros: TrazaRegistro[] = [];

  constructor(titulo: string) {
    this.titulo = titulo;
  }

  logEtapa(nombre: string) {
    this.registros.push({
      tipo: "ETAPA",
      mensaje: nombre,
    });
  }

  logInfo(mensaje: string, detalle?: any) {
    this.registros.push({
      tipo: "INFO",
      mensaje,
      detalle,
    });
  }

  logAdvertencia(mensaje: string, detalle?: any) {
    this.registros.push({
      tipo: "ADVERTENCIA",
      mensaje,
      detalle,
    });
  }

  logMapeo(subconjunto: string[], nuevoId: string, esFinal: boolean, esInicial: boolean = false) {
    const roles: string[] = [];
    if (esInicial) roles.push("Inicial");
    if (esFinal) roles.push("Final / Aceptación");
    if (roles.length === 0) roles.push("No Final");

    const subStr = "{" + [...subconjunto].sort().join(", ") + "}";
    this.registros.push({
      tipo: "MAPEO",
      mensaje: `Subconjunto original ${subStr} ⟹ Macro-Estado '${nuevoId}' [${roles.join(", ")}]`,
      detalle: {
        original: [...subconjunto].sort(),
        nuevoId,
        roles,
      },
    });
  }

  logParticion(iteracion: number, grupos: string[][]) {
    const formatted = grupos
      .map((g, idx) => `G${idx + 1} = {${g.sort().join(", ")}}`)
      .join("  |  ");
    this.registros.push({
      tipo: "PARTICION",
      mensaje: `Iteración P${iteracion}: ${formatted}`,
      detalle: { iteracion, grupos },
    });
  }
}
