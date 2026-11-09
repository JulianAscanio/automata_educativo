import { Automata } from "../core/Automata";
import { PedagogicalTracer } from "../core/Tracer";

export class ReachabilityCleaner {
  static limpiarInaccesibles(automata: Automata): {
    automataLimpio: Automata;
    inaccesibles: string[];
    tracer: PedagogicalTracer;
  } {
    const tracer = new PedagogicalTracer("LIMPIEZA DE ESTADOS INACCESIBLES (RF-07)");

    if (!automata.estadoInicial) {
      throw new Error("El autómata carece de estado inicial para iniciar la búsqueda BFS.");
    }

    const q0 = automata.estadoInicial.id;
    const alcanzables = new Set<string>([q0]);
    const cola: string[] = [q0];

    tracer.logInfo(`Iniciando recorrido en anchura (BFS) desde el estado inicial '${q0}'`);

    while (cola.length > 0) {
      const actual = cola.shift()!;
      const mapSimb = automata.transiciones.get(actual);
      if (!mapSimb) continue;

      for (const [simb, destinos] of mapSimb.entries()) {
        for (const dest of destinos) {
          if (!alcanzables.has(dest)) {
            alcanzables.add(dest);
            cola.push(dest);
            tracer.logInfo(`  Descubierto estado alcanzable '${dest}' vía δ(${actual}, '${simb}')`);
          }
        }
      }
    }

    const todosLosEstados = Array.from(automata.estados.keys());
    const inaccesibles = todosLosEstados.filter((q) => !alcanzables.has(q));

    if (inaccesibles.length > 0) {
      tracer.logAdvertencia(
        `Se detectaron ${inaccesibles.length} estado(s) inaccesible(s): [${inaccesibles.sort().join(", ")}]`
      );
      tracer.logInfo("Se eliminan estos estados del autómata para la minimización formal.");
    } else {
      tracer.logInfo("Verificación exitosa: Todos los estados son accesibles desde el estado inicial.");
    }

    // Reconstruir autómata con solo estados alcanzables
    const automataLimpio = new Automata(automata.alfabeto);

    for (const qId of Array.from(alcanzables).sort()) {
      const orig = automata.estados.get(qId)!;
      automataLimpio.agregarEstado(qId, orig.esInicial, orig.esFinal, orig.subEstados);
    }

    for (const t of automata.obtenerTodasLasTransiciones()) {
      if (alcanzables.has(t.origen) && alcanzables.has(t.destino)) {
        automataLimpio.agregarTransicion(t.origen, t.simbolo, t.destino);
      }
    }

    return { automataLimpio, inaccesibles, tracer };
  }
}
