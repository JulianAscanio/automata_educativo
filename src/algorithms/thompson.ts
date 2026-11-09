import { Alphabet } from "../core/Alphabet";
import { Automata } from "../core/Automata";
import { PedagogicalTracer } from "../core/Tracer";
import { EPSILON } from "../core/types";
import { RegexParser } from "./regexParser";

interface Fragmento {
  entrada: string;
  salida: string;
}

export class ThompsonAlgorithm {
  private alfabeto: Alphabet;
  private parser: RegexParser;

  constructor(alfabeto: Alphabet) {
    this.alfabeto = alfabeto;
    this.parser = new RegexParser(alfabeto);
  }

  construir(regex: string): { automata: Automata; tracer: PedagogicalTracer } {
    const tracer = new PedagogicalTracer("CONSTRUCCIÓN DE THOMPSON (Regex ⟹ ε-AFND)");
    const postfija = this.parser.aPostfija(regex);

    tracer.logInfo(`Expresión regular original: "${regex}"`);
    tracer.logInfo(`Expresión con concatenación explícita: "${this.parser.normalizar(regex)}"`);
    tracer.logInfo(`Notación postfija evaluada: "${postfija}"`);

    const automata = new Automata(this.alfabeto);
    let contador = 0;

    const crearEstado = (): string => {
      const id = `s${contador++}`;
      automata.agregarEstado(id);
      return id;
    };

    const pila: Fragmento[] = [];

    for (let i = 0; i < postfija.length; i++) {
      const token = postfija[i];

      if (this.alfabeto.pertenece(token)) {
        const sIn = crearEstado();
        const sOut = crearEstado();
        automata.agregarTransicion(sIn, token, sOut);
        pila.push({ entrada: sIn, salida: sOut });
        tracer.logInfo(`Símbolo '${token}': Creado fragmento base ${sIn} ──(${token})──> ${sOut}`);
      } else if (token === ".") {
        if (pila.length < 2) {
          throw new Error("Error en evaluación postfija: operandos insuficientes para concatenación.");
        }
        const f2 = pila.pop()!;
        const f1 = pila.pop()!;
        automata.agregarTransicion(f1.salida, EPSILON, f2.entrada);
        pila.push({ entrada: f1.entrada, salida: f2.salida });
        tracer.logInfo(`Concatenación (.): Enlazado ${f1.salida} ──(ε)──> ${f2.entrada}`);
      } else if (token === "|") {
        if (pila.length < 2) {
          throw new Error("Error en evaluación postfija: operandos insuficientes para unión (|).");
        }
        const f2 = pila.pop()!;
        const f1 = pila.pop()!;
        const sIn = crearEstado();
        const sOut = crearEstado();

        automata.agregarTransicion(sIn, EPSILON, f1.entrada);
        automata.agregarTransicion(sIn, EPSILON, f2.entrada);
        automata.agregarTransicion(f1.salida, EPSILON, sOut);
        automata.agregarTransicion(f2.salida, EPSILON, sOut);

        pila.push({ entrada: sIn, salida: sOut });
        tracer.logInfo(`Unión (|): Bifurcación desde ${sIn} hacia (${f1.entrada}, ${f2.entrada}) convergiendo en ${sOut}`);
      } else if (token === "*") {
        if (pila.length < 1) {
          throw new Error("Error en evaluación postfija: operando insuficiente para cerradura de Kleene (*).");
        }
        const f = pila.pop()!;
        const sIn = crearEstado();
        const sOut = crearEstado();

        automata.agregarTransicion(sIn, EPSILON, f.entrada);
        automata.agregarTransicion(sIn, EPSILON, sOut);
        automata.agregarTransicion(f.salida, EPSILON, f.entrada);
        automata.agregarTransicion(f.salida, EPSILON, sOut);

        pila.push({ entrada: sIn, salida: sOut });
        tracer.logInfo(`Cerradura de Kleene (*): Bucle añadido sobre ${f.entrada} y bypass directo ${sIn} ──(ε)──> ${sOut}`);
      }
    }

    if (pila.length !== 1) {
      throw new Error("Error interno: la pila de fragmentos contiene múltiples elementos no reducidos.");
    }

    const res = pila.pop()!;
    // Fijar inicial y final
    const estIni = automata.estados.get(res.entrada)!;
    estIni.esInicial = true;
    automata.estadoInicial = estIni;

    const estFin = automata.estados.get(res.salida)!;
    estFin.esFinal = true;
    automata.estadosFinales.add(res.salida);

    tracer.logInfo(
      `Autómata ε-AFND generado. Estado Inicial: ${res.entrada}, Estado Final: ${res.salida}, Total Estados: ${automata.estados.size}`
    );

    return { automata, tracer };
  }
}
