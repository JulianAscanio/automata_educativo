import { Automata } from "../core/Automata";
import { TipoAutomata, EPSILON } from "../core/types";

export interface ClasificacionResultado {
  tipo: TipoAutomata;
  esDeterminista: boolean;
  razones: string[];
  detalles: {
    transicionesEpsilon: string[];
    bifurcaciones: string[];
  };
}

export class AutomataClassifier {
  static clasificar(automata: Automata): ClasificacionResultado {
    const razones: string[] = [];
    const transicionesEpsilon: string[] = [];
    const bifurcaciones: string[] = [];

    if (!automata.estadoInicial) {
      razones.push("Advertencia pedagógica: El autómata no tiene estado inicial (q0) definido.");
    }

    for (const [origen, mapSimb] of automata.transiciones.entries()) {
      // 1. Chequeo de transiciones épsilon
      if (mapSimb.has(EPSILON) && mapSimb.get(EPSILON)!.size > 0) {
        for (const dest of mapSimb.get(EPSILON)!) {
          transicionesEpsilon.push(`δ(${origen}, ${EPSILON}) ➔ ${dest}`);
        }
      }

      // 2. Chequeo de múltiples transiciones con el mismo símbolo (no determinismo)
      for (const [simb, destinos] of mapSimb.entries()) {
        if (simb !== EPSILON && destinos.size > 1) {
          const destList = Array.from(destinos).sort().join(", ");
          bifurcaciones.push(`δ(${origen}, '${simb}') ➔ {${destList}}`);
        }
      }
    }

    if (transicionesEpsilon.length > 0) {
      razones.push(
        `Posee ${transicionesEpsilon.length} transición(es) épsilon (ε). Se requiere cálculo de ε-Closure para determinizar:`
      );
      for (const t of transicionesEpsilon) {
        razones.push(`  • ${t}`);
      }
      return {
        tipo: TipoAutomata.AFND_EPSILON,
        esDeterminista: false,
        razones,
        detalles: { transicionesEpsilon, bifurcaciones },
      };
    }

    if (bifurcaciones.length > 0) {
      razones.push(
        `Posee ${bifurcaciones.length} caso(s) de no-determinismo (múltiples transiciones para un mismo símbolo):`
      );
      for (const b of bifurcaciones) {
        razones.push(`  • ${b}`);
      }
      return {
        tipo: TipoAutomata.AFND,
        esDeterminista: false,
        razones,
        detalles: { transicionesEpsilon, bifurcaciones },
      };
    }

    razones.push("Cumple formalmente con la definición de Autómata Finito Determinista (AFD):");
    razones.push("  1. No presenta transiciones espontáneas épsilon (ε).");
    razones.push("  2. Para cada estado q ∈ Q y símbolo a ∈ Σ, existe a lo sumo un estado destino |δ(q, a)| ≤ 1.");

    return {
      tipo: TipoAutomata.AFD,
      esDeterminista: true,
      razones,
      detalles: { transicionesEpsilon, bifurcaciones },
    };
  }
}
