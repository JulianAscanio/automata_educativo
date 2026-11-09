"""
Módulo de Identificación y Verificación de Determinismo (RF-05).
Clasifica si un autómata es AFD, AFND o AFND-épsilon, detallando pedagógicamente las causas.
"""

from typing import Tuple, List
from core.models import Automata, TipoAutomata, EPSILON

class AutomataClassifier:
    @staticmethod
    def clasificar(automata: Automata) -> Tuple[TipoAutomata, List[str]]:
        """
        RF-05: Examina transiciones y devuelve el tipo formal con la explicación paso a paso.
        """
        razones = []
        transiciones_epsilon = []
        no_determinismos = []

        if automata.estado_inicial is None:
            razones.append("Advertencia: El autómata no posee estado inicial definido.")

        for origen, mapa_simb in automata.transiciones.items():
            # Chequeo de transiciones épsilon
            if EPSILON in mapa_simb and len(mapa_simb[EPSILON]) > 0:
                for dest in sorted(list(mapa_simb[EPSILON])):
                    transiciones_epsilon.append(f"δ({origen}, {EPSILON}) -> {dest}")

            # Chequeo de múltiples transiciones con un mismo símbolo
            for simb, destinos in mapa_simb.items():
                if simb != EPSILON and len(destinos) > 1:
                    dests_str = "{" + ", ".join(sorted(list(destinos))) + "}"
                    no_determinismos.append(f"δ({origen}, '{simb}') -> {dests_str}")

        if transiciones_epsilon:
            razones.append(f"Posee {len(transiciones_epsilon)} transición(es) épsilon (ε):")
            for t in transiciones_epsilon:
                razones.append(f"  - {t}")
            return TipoAutomata.AFND_EPSILON, razones

        if no_determinismos:
            razones.append(f"Posee {len(no_determinismos)} caso(s) de bifurcación no determinista:")
            for nd in no_determinismos:
                razones.append(f"  - {nd}")
            return TipoAutomata.AFND, razones

        razones.append("Determinismo verificado:")
        razones.append("  1. No existen transiciones épsilon (ε).")
        razones.append("  2. Para cada estado q y cada símbolo 'a', existe a lo sumo una transición δ(q, a).")
        return TipoAutomata.AFD, razones
