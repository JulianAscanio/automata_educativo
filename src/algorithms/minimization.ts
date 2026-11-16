import { Automata } from "../core/Automata";
import { PedagogicalTracer } from "../core/Tracer";
import { ReachabilityCleaner } from "./reachability";

export class DFAMinimizer {
  static minimizar(afd: Automata): {
    afdMinimo: Automata;
    tracer: PedagogicalTracer;
  } {
    const tracer = new PedagogicalTracer("MINIMIZACIÓN DE AFD POR PARTICIONAMIENTO (RF-09)");

    // 1. Limpieza preliminar de estados inaccesibles (RF-07)
    tracer.logEtapa("Etapa 1: Poda de Estados Inaccesibles (RF-07)");
    const { automataLimpio, inaccesibles, tracer: tracerLimp } = ReachabilityCleaner.limpiarInaccesibles(afd);
    for (const r of tracerLimp.registros) {
      if (r.tipo === "ADVERTENCIA") {
        tracer.logAdvertencia(r.mensaje);
      } else {
        tracer.logInfo(r.mensaje);
      }
    }

    if (afd.tieneEpsilon() || afd.obtenerTodasLasTransiciones().some(
      (t) => afd.obtenerTransiciones(t.origen, t.simbolo).size > 1
    )) throw new Error("RF-09: Debe determinizar el autómata antes de minimizarlo.");

    // Completar sobre la copia para comparar correctamente el rechazo implícito.
    const faltantes = Array.from(automataLimpio.estados.keys()).flatMap((q) =>
      automataLimpio.alfabeto.simbolos.filter((s) =>
        automataLimpio.obtenerTransiciones(q, s).size === 0).map((s) => ({ q, s })));
    if (faltantes.length) {
      let pozo = "pozo";
      while (automataLimpio.estados.has(pozo)) pozo += "_";
      automataLimpio.agregarEstado(pozo);
      for (const s of automataLimpio.alfabeto.simbolos) automataLimpio.agregarTransicion(pozo, s, pozo);
      for (const { q, s } of faltantes) automataLimpio.agregarTransicion(q, s, pozo);
      tracer.logInfo(`Se completan ${faltantes.length} transiciones indefinidas hacia '${pozo}', estado de rechazo, antes de refinar las particiones.`);
    }

    // 2. Partición inicial P0 = {No-Finales, Finales}
    tracer.logEtapa("Etapa 2: Partición Inicial P0 (Finales vs No Finales)");
    const todos = Array.from(automataLimpio.estados.keys());
    const finales = Array.from(automataLimpio.estadosFinales);
    const noFinales = todos.filter((q) => !automataLimpio.estadosFinales.has(q));

    let particiones: string[][] = [];
    if (noFinales.length > 0) particiones.push(noFinales);
    if (finales.length > 0) particiones.push(finales);

    tracer.logParticion(0, particiones);

    // Función auxiliar para obtener el índice de grupo al que transiciona un estado
    const obtenerIndiceGrupo = (estadoId: string, simbolo: string, parts: string[][]): number => {
      const dests = Array.from(automataLimpio.obtenerTransiciones(estadoId, simbolo));
      if (dests.length === 0) return -1; // Transición a pozo o indefinida
      const dest = dests[0];
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].includes(dest)) {
          return i;
        }
      }
      return -1;
    };

    // 3. Refinamiento iterativo de particiones
    tracer.logEtapa("Etapa 3: Refinamiento Iterativo de Particiones");
    let iteracion = 1;
    let huboCambio = true;

    while (huboCambio) {
      huboCambio = false;
      const nuevaParticion: string[][] = [];

      for (const grupo of particiones) {
        if (grupo.length <= 1) {
          nuevaParticion.push(grupo);
          continue;
        }

        // Agrupar estados por su vector de firmas: [grupo_destino_para_simb1, grupo_destino_para_simb2, ...]
        const subGrupos = new Map<string, string[]>();

        for (const estado of grupo) {
          const firma = automataLimpio.alfabeto.simbolos
            .map((s) => `${s}:${obtenerIndiceGrupo(estado, s, particiones)}`)
            .join("|");

          if (!subGrupos.has(firma)) {
            subGrupos.set(firma, []);
          }
          subGrupos.get(firma)!.push(estado);
        }

        if (subGrupos.size > 1) {
          huboCambio = true;
          tracer.logInfo(
            `Iteración ${iteracion}: El grupo {${grupo.join(", ")}} se fractura en ${subGrupos.size} sub-bloques debido a diferencias en sus transiciones.`
          );
        }

        for (const sg of subGrupos.values()) {
          nuevaParticion.push(sg);
        }
      }

      particiones = nuevaParticion;
      tracer.logParticion(iteracion, particiones);
      iteracion++;
    }

    // 4. Construcción del AFD Mínimo
    tracer.logEtapa("Etapa 4: Construcción del Autómata Finito Mínimo");
    const afdMinimo = new Automata(automataLimpio.alfabeto);

    // Mapeo de estado original -> id de macro-estado mínimo
    const estadoAMacro = new Map<string, string>();
    const nombresMacro: string[] = [];

    particiones.forEach((grupo, idx) => {
      const nombre = `M${idx}`;
      nombresMacro.push(nombre);

      const esInicial = grupo.includes(automataLimpio.estadoInicial!.id);
      const esFinal = grupo.some((q) => automataLimpio.estadosFinales.has(q));

      afdMinimo.agregarEstado(nombre, esInicial, esFinal, grupo);

      for (const q of grupo) {
        estadoAMacro.set(q, nombre);
      }

      tracer.logMapeo(grupo, nombre, esFinal, esInicial);
    });

    // Añadir transiciones
    for (let idx = 0; idx < particiones.length; idx++) {
      const grupo = particiones[idx];
      const representante = grupo[0];
      const macroOrigen = nombresMacro[idx];

      for (const s of automataLimpio.alfabeto.simbolos) {
        const dests = Array.from(automataLimpio.obtenerTransiciones(representante, s));
        if (dests.length > 0) {
          const macroDestino = estadoAMacro.get(dests[0]);
          if (macroDestino) {
            afdMinimo.agregarTransicion(macroOrigen, s, macroDestino);
          }
        }
      }
    }

    tracer.logInfo(
      `Minimización completada. El AFD original tenía ${automataLimpio.estados.size} estados. El AFD mínimo tiene ${afdMinimo.estados.size} estados equivalentes.`
    );

    return { afdMinimo, tracer };
  }
}
