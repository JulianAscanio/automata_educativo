"""
Módulo de Detección y Eliminación de Estados Inaccesibles (RF-07).
Utiliza búsqueda en anchura (BFS) desde el estado inicial q0 para encontrar estados alcanzables.
"""

from typing import Tuple, Set, List
from core.models import Automata, Estado
from core.tracer import PedagogicalTracer

class ReachabilityCleaner:
    @staticmethod
    def limpiar_inaccesibles(automata: Automata) -> Tuple[Automata, PedagogicalTracer]:
        """
        RF-07: Identifica y elimina estados inalcanzables desde el estado inicial.
        Genera bitácora educativa de los estados eliminados vs conservados.
        """
        tracer = PedagogicalTracer("LIMPIEZA DE ESTADOS INACCESIBLES (RF-07)")

        if automata.estado_inicial is None:
            tracer.log("Error: El autómata no posee estado inicial.", categoria="ERROR")
            raise ValueError("El autómata carece de estado inicial.")

        q0 = automata.estado_inicial.id
        alcanzables: Set[str] = set()
        cola: List[str] = [q0]
        alcanzables.add(q0)

        tracer.log(f"Iniciando recorrido BFS desde el estado inicial: '{q0}'")

        while cola:
            actual = cola.pop(0)
            for simb, destinos in automata.transiciones.get(actual, {}).items():
                for dest in destinos:
                    if dest not in alcanzables:
                        alcanzables.add(dest)
                        cola.append(dest)
                        tracer.log(f"  Descubierto estado '{dest}' alcanzable mediante δ({actual}, '{simb}')")

        todos_los_estados = set(automata.estados.keys())
        inaccesibles = todos_los_estados - alcanzables

        if inaccesibles:
            tracer.log(f"Se detectaron {len(inaccesibles)} estado(s) inaccesible(s): {sorted(list(inaccesibles))}",
                       categoria="ADVERTENCIA")
            tracer.log("Procediendo a podar estos estados del autómata para la minimización formal.")
        else:
            tracer.log("Verificación completa: Todos los estados son accesibles desde el estado inicial.")

        # Reconstruir autómata limpio
        nuevo_automata = Automata(automata.alfabeto)

        for q_id in sorted(list(alcanzables)):
            est_orig = automata.estados[q_id]
            nuevo_automata.agregar_estado(
                id_estado=q_id,
                es_inicial=est_orig.es_inicial,
                es_final=est_orig.es_final,
                sub_estados=est_orig.sub_estados
            )

        for q_id in alcanzables:
            for simb, destinos in automata.transiciones.get(q_id, {}).items():
                for dest in destinos:
                    if dest in alcanzables:
                        nuevo_automata.agregar_transicion(q_id, simb, dest)

        tracer.log(f"Autómata limpio generado: {len(nuevo_automata.estados)} estados conservados.")
        return nuevo_automata, tracer
