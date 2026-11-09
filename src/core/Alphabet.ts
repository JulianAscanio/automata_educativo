import { EPSILON } from "./types";

export class Alphabet {
  private _simbolos: Set<string>;

  constructor(simbolos: string[]) {
    if (!simbolos || simbolos.length === 0) {
      throw new Error("RF-01: El alfabeto no puede estar vacío.");
    }

    // RF-01: Validar que no haya símbolos duplicados
    const unicos = new Set<string>();
    const duplicados: string[] = [];

    for (const s of simbolos) {
      const limpio = s.trim();
      if (!limpio) {
        throw new Error("RF-01: Los símbolos no pueden ser cadenas vacías ni espacios en blanco.");
      }
      if (limpio === EPSILON) {
        throw new Error(`RF-01: El símbolo '${EPSILON}' está reservado para transiciones épsilon.`);
      }
      if (unicos.has(limpio)) {
        duplicados.push(limpio);
      }
      unicos.add(limpio);
    }

    if (duplicados.length > 0) {
      throw new Error(`RF-01 Violado: El alfabeto contiene símbolos duplicados: [${duplicados.join(", ")}]`);
    }

    this._simbolos = unicos;
  }

  get simbolos(): string[] {
    return Array.from(this._simbolos).sort();
  }

  pertenece(simbolo: string): boolean {
    return this._simbolos.has(simbolo) || simbolo === EPSILON;
  }

  validarCadena(cadena: string): boolean {
    for (const c of cadena) {
      if (!this._simbolos.has(c)) {
        return false;
      }
    }
    return true;
  }
}
