import { Alphabet } from "./Alphabet";
import { Estado, Transicion, EPSILON } from "./types";

export class Automata {
  public alfabeto: Alphabet;
  public estados: Map<string, Estado>;
  public estadoInicial: Estado | null = null;
  public estadosFinales: Set<string>;
  public transiciones: Map<string, Map<string, Set<string>>>;

  constructor(alfabeto: Alphabet) {
    this.alfabeto = alfabeto;
    this.estados = new Map();
    this.estadosFinales = new Set();
    this.transiciones = new Map();
  }

  agregarEstado(
    id: string,
    esInicial: boolean = false,
    esFinal: boolean = false,
    subEstados?: string[]
  ): Estado {
    if (this.estados.has(id)) {
      throw new Error(`El estado '${id}' ya está registrado en el autómata.`);
    }

    if (esInicial && this.estadoInicial !== null) {
      throw new Error(
        `Conflicto formal: Ya existe un estado inicial '${this.estadoInicial.id}'. Solo puede haber un q0.`
      );
    }

    const estado: Estado = {
      id,
      esInicial,
      esFinal,
      subEstados: subEstados ? [...subEstados].sort() : undefined,
    };

    this.estados.set(id, estado);
    this.transiciones.set(id, new Map());

    if (esInicial) {
      this.estadoInicial = estado;
    }
    if (esFinal) {
      this.estadosFinales.add(id);
    }

    return estado;
  }

  agregarTransicion(origen: string, simbolo: string, destino: string): void {
    if (!this.estados.has(origen)) {
      throw new Error(`Estado de origen '${origen}' no está registrado.`);
    }
    if (!this.estados.has(destino)) {
      throw new Error(`Estado de destino '${destino}' no está registrado.`);
    }
    if (!this.alfabeto.pertenece(simbolo)) {
      throw new Error(
        `Símbolo '${simbolo}' no pertenece al alfabeto [${this.alfabeto.simbolos.join(", ")}] ni es '${EPSILON}'.`
      );
    }

    const mapaOrigen = this.transiciones.get(origen)!;
    if (!mapaOrigen.has(simbolo)) {
      mapaOrigen.set(simbolo, new Set());
    }
    mapaOrigen.get(simbolo)!.add(destino);
  }

  obtenerTransiciones(origen: string, simbolo: string): Set<string> {
    return this.transiciones.get(origen)?.get(simbolo) || new Set();
  }

  obtenerTodasLasTransiciones(): Transicion[] {
    const lista: Transicion[] = [];
    for (const [orig, mapSimb] of this.transiciones.entries()) {
      for (const [simb, dests] of mapSimb.entries()) {
        for (const dest of dests) {
          lista.push({ origen: orig, simbolo: simb, destino: dest });
        }
      }
    }
    return lista;
  }

  tieneEpsilon(): boolean {
    for (const [, mapSimb] of this.transiciones.entries()) {
      if (mapSimb.has(EPSILON) && mapSimb.get(EPSILON)!.size > 0) {
        return true;
      }
    }
    return false;
  }

  obtenerListaEstados(): Estado[] {
    return Array.from(this.estados.values());
  }

  obtenerTablaTransicion(): {
    columnas: string[];
    filas: Array<{
      estado: Estado;
      celdas: Record<string, string>;
    }>;
  } {
    const simbolos = [...this.alfabeto.simbolos];
    if (this.tieneEpsilon()) {
      simbolos.push(EPSILON);
    }

    const filas = Array.from(this.estados.values()).map((est) => {
      const celdas: Record<string, string> = {};
      for (const s of simbolos) {
        const dests = Array.from(this.obtenerTransiciones(est.id, s)).sort();
        celdas[s] = dests.length > 0 ? (dests.length > 1 ? `{${dests.join(", ")}}` : dests[0]) : "—";
      }
      return { estado: est, celdas };
    });

    return { columnas: simbolos, filas };
  }
}
