"""
Algoritmo de Determinización mediante Construcción de Subconjuntos (Subset Construction - RF-06).
Incluye el cálculo de Clausura Épsilon (ε-Closure) y trazabilidad pedagógica de macro-estados (RF-10, RF-13).
"""

from typing import Set, Dict, List, Tuple, FrozenSet, Optional
from core.models import Automata, Estado, Alfabeto, EPSILON
from core.tracer import PedagogicalTracer

def epsilon_closure(automata: Automata, estados: Set[str], tracer: Optional[PedagogicalTracer] = None) -> FrozenSet[str]:
    """
    Calcula la clausura épsilon (ε-closure) de un conjunto de estados.
    """
    pila = list(estados)
    clausura = set(estados)

    while pila:
        actual = pila.pop()
        destinos_eps = automata.obtener_transiciones_desde(actual, EPSILON)
        for dest in destinos_eps:
            if dest not in clausura:
                clausura.add(dest)
                pila.append(dest)
                if tracer:
                    tracer.log(f"    ε-Closure: Al alcanzar '{dest}' desde '{actual}' por ε")

    return frozenset(clausura)

class SubsetConstruction:
    def __init__(self, afnd: Automata):
        self.afnd = afnd

    @staticmethod
    def formatear_nombre_macro_estado(subconjunto: FrozenSet[str]) -> str:
        """Nomenclatura consistente: {q1, q2} -> q_q1_q2"""
        if not subconjunto:
            return "q_vacio"
        elementos_ordenados = sorted(list(subconjunto))
        return "q_" + "_".join(elementos_ordenados)

    def determinizar(self) -> Tuple[Automata, PedagogicalTracer]:
        tracer = PedagogicalTracer("CONSTRUCCIÓN DE SUBCONJUNTOS / DETERMINIZACIÓN (RF-06)")

        if self.afnd.estado_inicial is None:
            raise ValueError("El autómata no posee estado inicial.")

        afd = Automata(self.afnd.alfabeto)

        tracer.log_etapa("Paso 1: Cálculo del Estado Inicial del AFD")
        conjunto_inicial = epsilon_closure(self.afnd, {self.afnd.estado_inicial.id}, tracer)
        nombre_inicial = self.formatear_nombre_macro_estado(conjunto_inicial)
        es_inicial_final = any(q in self.afnd.estados_finales for q in conjunto_inicial)

        afd.agregar_estado(
            id_estado=nombre_inicial,
            es_inicial=True,
            es_final=es_inicial_final,
            sub_estados=conjunto_inicial
        )
        tracer.log_mapeo_estado(conjunto_inicial, nombre_inicial, es_inicial_final, es_inicial=True)

        mapeo_subconjuntos: Dict[FrozenSet[str], str] = {conjunto_inicial: nombre_inicial}
        cola_pendientes: List[FrozenSet[str]] = [conjunto_inicial]

        tracer.log_etapa("Paso 2: Exploración Iterativa de Macro-Estados y Transiciones")

        while cola_pendientes:
            macro_actual = cola_pendientes.pop(0)
            nombre_actual = mapeo_subconjuntos[macro_actual]

            tracer.log(f"\nExplorando Macro-Estado {nombre_actual} = {{{', '.join(sorted(macro_actual))}}}:")

            for simbolo in sorted(list(self.afnd.alfabeto.simbolos)):
                # Move(T, a)
                movimiento: Set[str] = set()
                for q in macro_actual:
                    movimiento.update(self.afnd.obtener_transiciones_desde(q, simbolo))

                if not movimiento:
                    tracer.log(f"  Move({nombre_actual}, '{simbolo}') = ∅ (Sin transición)")
                    continue

                # ε-Closure(Move(T, a))
                macro_destino = epsilon_closure(self.afnd, movimiento, tracer)
                tracer.log(f"  δ({nombre_actual}, '{simbolo}') -> Move={sorted(list(movimiento))} "
                           f"-> ε-Closure={sorted(list(macro_destino))}")

                if macro_destino not in mapeo_subconjuntos:
                    nombre_destino = self.formatear_nombre_macro_estado(macro_destino)
                    base = nombre_destino
                    sufijo = 1
                    while nombre_destino in afd.estados:
                        nombre_destino = f"{base}__{sufijo}"
                        sufijo += 1
                    es_destino_final = any(q in self.afnd.estados_finales for q in macro_destino)

                    afd.agregar_estado(
                        id_estado=nombre_destino,
                        es_inicial=False,
                        es_final=es_destino_final,
                        sub_estados=macro_destino
                    )
                    mapeo_subconjuntos[macro_destino] = nombre_destino
                    cola_pendientes.append(macro_destino)

                    tracer.log_mapeo_estado(macro_destino, nombre_destino, es_destino_final, es_inicial=False)

                nombre_destino_registrado = mapeo_subconjuntos[macro_destino]
                afd.agregar_transicion(nombre_actual, simbolo, nombre_destino_registrado)
                tracer.log(f"    -> Transición añadida: δ({nombre_actual}, '{simbolo}') = {nombre_destino_registrado}")

        tracer.log("\nDeterminización completada. Todos los macro-estados han sido explorados.")
        return afd, tracer
