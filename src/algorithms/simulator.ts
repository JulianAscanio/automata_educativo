import { Automata } from "../core/Automata";
import { AutomataClassifier } from "./classifier";
import { ResultadoSimulacion, SimulacionPaso } from "../core/types";

export class StringSimulator {
  static simular(afd: Automata, cadena: string): ResultadoSimulacion {
    if (!AutomataClassifier.clasificar(afd).esDeterminista) {
      throw new Error("Selecciona la etapa Determinizado o AFD Mínimo para simular cadenas. El autómata actual es no determinista.");
    }
    const pasos: SimulacionPaso[] = [];

    if (!afd.estadoInicial) {
      return {
        aceptada: false,
        pasos: [],
        mensajeFinal: "Error: El autómata no posee un estado inicial definido.",
      };
    }

    let actual = afd.estadoInicial.id;
    let pasoNum = 0;

    pasos.push({
      paso: pasoNum,
      estadoActual: actual,
      cadenaRestante: cadena,
      descripcion: `Inicio en el estado inicial '${actual}'. Cadena completa por procesar: "${cadena}"`,
    });

    for (let i = 0; i < cadena.length; i++) {
      const simbolo = cadena[i];
      pasoNum++;

      if (!afd.alfabeto.pertenece(simbolo)) {
        pasos.push({
          paso: pasoNum,
          estadoActual: actual,
          simboloConsumido: simbolo,
          cadenaRestante: cadena.slice(i),
          descripcion: `Error: El símbolo '${simbolo}' no pertenece al alfabeto Σ. Cadena rechazada de inmediato.`,
        });
        return {
          aceptada: false,
          pasos,
          mensajeFinal: `RECHAZADA: Símbolo '${simbolo}' ∉ Σ en la posición ${i + 1}.`,
        };
      }

      const destinos = Array.from(afd.obtenerTransiciones(actual, simbolo));

      if (destinos.length === 0) {
        pasos.push({
          paso: pasoNum,
          estadoActual: actual,
          simboloConsumido: simbolo,
          cadenaRestante: cadena.slice(i + 1),
          descripcion: `Bloqueo: No existe transición definida δ(${actual}, '${simbolo}'). El procesamiento se detiene.`,
        });
        return {
          aceptada: false,
          pasos,
          mensajeFinal: `RECHAZADA: Transición indefinida desde el estado '${actual}' con el símbolo '${simbolo}'.`,
        };
      }

      const siguiente = destinos[0];
      const restante = cadena.slice(i + 1);

      pasos.push({
        paso: pasoNum,
        estadoActual: actual,
        simboloConsumido: simbolo,
        siguienteEstado: siguiente,
        cadenaRestante: restante,
        descripcion: `Consumiendo '${simbolo}': Transición δ(${actual}, '${simbolo}') ➔ '${siguiente}'. Restante: "${restante || "ε"}"`,
      });

      actual = siguiente;
    }

    const esFinal = afd.estadosFinales.has(actual);
    const mensajeFinal = esFinal
      ? `ACEPTADA: Toda la cadena fue procesada y el autómata finalizó en el estado de aceptación '${actual}'.`
      : `RECHAZADA: La cadena fue consumida en su totalidad, pero el estado de parada '${actual}' no es un estado de aceptación.`;

    pasos.push({
      paso: pasoNum + 1,
      estadoActual: actual,
      cadenaRestante: "",
      descripcion: `Fin del procesamiento. Estado final alcanzado: '${actual}' [${
        esFinal ? "ESTADO DE ACEPTACIÓN" : "ESTADO NO FINAL"
      }].`,
    });

    return {
      aceptada: esFinal,
      pasos,
      mensajeFinal,
    };
  }
}
