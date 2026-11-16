import { Alphabet } from "../core/Alphabet";
import { Automata } from "../core/Automata";
import { PedagogicalTracer } from "../core/Tracer";
import { EPSILON } from "../core/types";

export function epsilonClosure(
  automata: Automata,
  estados: Set<string>,
  tracer?: PedagogicalTracer
): Set<string> {
  const clausura = new Set<string>(estados);
  const pila = Array.from(estados);

  while (pila.length > 0) {
    const actual = pila.pop()!;
    const destinosEps = automata.obtenerTransiciones(actual, EPSILON);

    for (const dest of destinosEps) {
      if (!clausura.has(dest)) {
        clausura.add(dest);
        pila.push(dest);
        if (tracer) {
          tracer.logInfo(`  ε-Closure: '${actual}' alcanza a '${dest}' mediante ε`);
        }
      }
    }
  }

  return clausura;
}

export class SubsetConstruction {
  static formatearMacroEstado(subconjunto: Set<string>): string {
    if (subconjunto.size === 0) return "q_vacio";
    const ordenados = Array.from(subconjunto).sort();
    return "q_" + ordenados.join("_");
  }

  static determinizar(afnd: Automata): {
    afd: Automata;
    tracer: PedagogicalTracer;
  } {
    const tracer = new PedagogicalTracer("CONSTRUCCIÓN DE SUBCONJUNTOS (RF-06)");

    if (!afnd.estadoInicial) {
      throw new Error("El autómata carece de estado inicial.");
    }

    const afd = new Automata(afnd.alfabeto);

    // 1. Estado inicial del AFD
    tracer.logEtapa("Paso 1: Cálculo del Estado Inicial");
    const conjuntoInicial = epsilonClosure(afnd, new Set([afnd.estadoInicial.id]), tracer);
    const nombreInicial = this.formatearMacroEstado(conjuntoInicial);
    const esInicialFinal = Array.from(conjuntoInicial).some((q) => afnd.estadosFinales.has(q));

    afd.agregarEstado(
      nombreInicial,
      true,
      esInicialFinal,
      Array.from(conjuntoInicial)
    );

    tracer.logMapeo(Array.from(conjuntoInicial), nombreInicial, esInicialFinal, true);

    // 2. Proceso de exploración
    tracer.logEtapa("Paso 2: Exploración de Transiciones de Macro-Estados");

    // Mapeo conjunto ordenado en string -> nombre del macro estado
    const claveAEstado = new Map<string, string>();
    const cola: Set<string>[] = [conjuntoInicial];
    claveAEstado.set(JSON.stringify(Array.from(conjuntoInicial).sort()), nombreInicial);

    while (cola.length > 0) {
      const actual = cola.shift()!;
      const actualNombre = claveAEstado.get(JSON.stringify(Array.from(actual).sort()))!;

      for (const simbolo of afnd.alfabeto.simbolos) {
        // Moverse con el símbolo
        const destinos = new Set<string>();
        for (const q of actual) {
          for (const d of afnd.obtenerTransiciones(q, simbolo)) {
            destinos.add(d);
          }
        }

        if (destinos.size === 0) {
          // No hay transición para este símbolo
          continue;
        }

        // Calcular la clausura épsilon de los destinos
        const clausuraDestinos = epsilonClosure(afnd, destinos);
        const claveDest = JSON.stringify(Array.from(clausuraDestinos).sort());

        let nombreDestino = claveAEstado.get(claveDest);

        if (!nombreDestino) {
          nombreDestino = this.formatearMacroEstado(clausuraDestinos);
          const base = nombreDestino;
          let sufijo = 1;
          while (afd.estados.has(nombreDestino)) nombreDestino = `${base}__${sufijo++}`;
          claveAEstado.set(claveDest, nombreDestino);

          const esFinal = Array.from(clausuraDestinos).some((q) => afnd.estadosFinales.has(q));
          afd.agregarEstado(nombreDestino, false, esFinal, Array.from(clausuraDestinos));
          cola.push(clausuraDestinos);

          tracer.logMapeo(Array.from(clausuraDestinos), nombreDestino, esFinal, false);
        }

        afd.agregarTransicion(actualNombre, simbolo, nombreDestino);
        tracer.logInfo(
          `δ_AFD(${actualNombre}, '${simbolo}') ➔ ${nombreDestino} (generado desde {${Array.from(
            clausuraDestinos
          ).sort().join(", ")}})`
        );
      }
    }

    tracer.logInfo(
      `Determinización finalizada. El AFD resultante contiene ${afd.estados.size} macro-estados y ${afd.estadosFinales.size} finales.`
    );

    return { afd, tracer };
  }
}
