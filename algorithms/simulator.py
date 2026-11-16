"""
Módulo de Simulación Paso a Paso de Cadenas (RF-12).
Ejecuta la cadena en el autómata determinista símbolo a símbolo,
registrando cada transición para su visualización educativa.
"""

from typing import Dict, Any, List, Tuple
from core.models import Automata
from core.models import TipoAutomata
from algorithms.classifier import AutomataClassifier

class StringSimulator:
    @staticmethod
    def simular(afd: Automata, cadena: str) -> Tuple[bool, List[Dict[str, Any]], str]:
        """
        RF-12: Simula el consumo de la cadena símbolo a símbolo en el AFD.
        Retorna:
          - aceptada (bool): True si culmina en un estado de aceptación F.
          - pasos (List[Dict]): Lista de registros del recorrido paso a paso.
          - mensaje_final (str): Veredicto formal.
        """
        if AutomataClassifier.clasificar(afd)[0] != TipoAutomata.AFD:
            raise ValueError("Selecciona el AFD determinizado o mínimo para simular; el autómata actual es no determinista.")
        pasos = []

        if afd.estado_inicial is None:
            return False, [], "Error: El autómata no posee un estado inicial definido."

        actual = afd.estado_inicial.id
        paso_num = 0

        pasos.append({
            "paso": paso_num,
            "estado_actual": actual,
            "simbolo_consumido": None,
            "cadena_restante": cadena,
            "descripcion": f"Inicio en el estado inicial '{actual}'. Cadena a procesar: \"{cadena}\""
        })

        for i, simbolo in enumerate(cadena):
            paso_num += 1

            if not afd.alfabeto.validar_simbolo(simbolo):
                pasos.append({
                    "paso": paso_num,
                    "estado_actual": actual,
                    "simbolo_consumido": simbolo,
                    "cadena_restante": cadena[i:],
                    "descripcion": f"Error: El símbolo '{simbolo}' ∉ Σ. Rechazada de inmediato."
                })
                return False, pasos, f"RECHAZADA: Símbolo '{simbolo}' no pertenece al alfabeto Σ."

            destinos = afd.obtener_transiciones_desde(actual, simbolo)

            if not destinos:
                pasos.append({
                    "paso": paso_num,
                    "estado_actual": actual,
                    "simbolo_consumido": simbolo,
                    "cadena_restante": cadena[i + 1:],
                    "descripcion": f"Bloqueo: No existe transición δ({actual}, '{simbolo}')."
                })
                return False, pasos, f"RECHAZADA: Transición indefinida desde '{actual}' con símbolo '{simbolo}'."

            siguiente = next(iter(destinos))
            restante = cadena[i + 1:]

            pasos.append({
                "paso": paso_num,
                "estado_actual": actual,
                "simbolo_consumido": simbolo,
                "siguiente_estado": siguiente,
                "cadena_restante": restante,
                "descripcion": f"Consumiendo '{simbolo}': δ({actual}, '{simbolo}') ➔ '{siguiente}'. Restante: \"{restante or 'ε'}\""
            })

            actual = siguiente

        es_aceptada = actual in afd.estados_finales
        mensaje_final = (
            f"ACEPTADA: Cadena consumida totalmente y finalizó en estado de aceptación '{actual}'."
            if es_aceptada
            else f"RECHAZADA: Cadena consumida totalmente pero '{actual}' NO es estado de aceptación."
        )

        pasos.append({
            "paso": paso_num + 1,
            "estado_actual": actual,
            "cadena_restante": "",
            "descripcion": f"Fin del recorrido. Estado alcanzado: '{actual}' [{'ACEPTACIÓN' if es_aceptada else 'NO FINAL'}]."
        })

        return es_aceptada, pasos, mensaje_final
