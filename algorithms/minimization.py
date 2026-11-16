"""
Algoritmo de Minimización de AFD (RF-09).
Implementa la partición iterativa de estados equivalentes (Algoritmo de Moore / Hopcroft)
y genera la bitácora formativa del refinamiento de particiones P0, P1, ..., Pk (RF-10, RF-13).
"""

from typing import List, Dict, Tuple, FrozenSet, Set
from core.models import Automata, Estado
from core.tracer import PedagogicalTracer
from algorithms.reachability import ReachabilityCleaner

class DFAMinimizer:
    @staticmethod
    def minimizar(afd: Automata) -> Tuple[Automata, PedagogicalTracer]:
        tracer = PedagogicalTracer("MINIMIZACIÓN DE AFD POR PARTICIONAMIENTO (RF-09)")

        # 1. Podado preliminar de inaccesibles (RF-07)
        tracer.log_etapa("Etapa 1: Poda de Estados Inaccesibles Previos")
        afd_limpio, tracer_limpieza = ReachabilityCleaner.limpiar_inaccesibles(afd)
        for r in tracer_limpieza.registros:
            tracer.log(r["mensaje"], categoria=r["categoria"])

        if afd.tiene_transiciones_epsilon() or any(
            len(destinos) > 1 for mapa in afd.transiciones.values() for destinos in mapa.values()
        ):
            raise ValueError("RF-09: Debe determinizar el autómata antes de minimizarlo.")
        faltantes = [(q, s) for q in afd_limpio.estados
                     for s in afd_limpio.alfabeto.simbolos
                     if not afd_limpio.obtener_transiciones_desde(q, s)]
        if faltantes:
            pozo = "pozo"
            while pozo in afd_limpio.estados:
                pozo += "_"
            afd_limpio.agregar_estado(pozo)
            for simbolo in afd_limpio.alfabeto.simbolos:
                afd_limpio.agregar_transicion(pozo, simbolo, pozo)
            for origen, simbolo in faltantes:
                afd_limpio.agregar_transicion(origen, simbolo, pozo)
            tracer.log(f"Se completan {len(faltantes)} transiciones indefinidas hacia '{pozo}', estado de rechazo.")

        # 2. Partición Inicial P0 = {F, Q \ F}
        tracer.log_etapa("Etapa 2: Partición Inicial P0 (Finales vs No-Finales)")
        finales = frozenset(afd_limpio.estados_finales)
        no_finales = frozenset(set(afd_limpio.estados.keys()) - afd_limpio.estados_finales)

        particiones: List[FrozenSet[str]] = []
        if no_finales:
            particiones.append(no_finales)
        if finales:
            particiones.append(finales)

        tracer.log(f"P0: Grupos iniciales definidos ({len(particiones)} grupo(s)):")
        if no_finales:
            tracer.log(f"  Grupo No-Finales G0 = {{{', '.join(sorted(no_finales))}}}")
        if finales:
            tracer.log(f"  Grupo Finales G1 = {{{', '.join(sorted(finales))}}}")

        def obtener_indice_grupo(estado_id: str, simbolo: str, particion_act: List[FrozenSet[str]]) -> int:
            dests = afd_limpio.obtener_transiciones_desde(estado_id, simbolo)
            if not dests:
                return -1  # Transición nula / estado pozo tácito
            dest = next(iter(dests))
            for idx, grp in enumerate(particion_act):
                if dest in grp:
                    return idx
            return -1

        # 3. Refinamiento iterativo
        tracer.log_etapa("Etapa 3: Refinamiento Iterativo de Particiones")
        iteracion = 1
        hubo_cambio = True

        while hubo_cambio:
            hubo_cambio = False
            nueva_particion: List[FrozenSet[str]] = []
            tracer.log(f"\nIteración {iteracion}: Analizando {len(particiones)} grupos")

            for idx_g, grupo in enumerate(particiones):
                if len(grupo) <= 1:
                    nueva_particion.append(grupo)
                    continue

                # Diccionario para agrupar estados que tienen el mismo vector de firmas hacia los grupos actuales
                firmas: Dict[Tuple[int, ...], List[str]] = {}
                simbolos_ordenados = sorted(list(afd_limpio.alfabeto.simbolos))

                for est in sorted(list(grupo)):
                    firma = tuple(obtener_indice_grupo(est, s, particiones) for s in simbolos_ordenados)
                    firmas.setdefault(firma, []).append(est)

                if len(firmas) > 1:
                    hubo_cambio = True
                    tracer.log(f"  El grupo {set(grupo)} se divide en {len(firmas)} sub-bloques:")
                    for sig, miembros in firmas.items():
                        tracer.log(f"    Sub-bloque {set(miembros)} con firma de transiciones {sig}")
                else:
                    tracer.log(f"  El grupo {set(grupo)} permanece indivisible (estados equivalentes).")

                for miembros in firmas.values():
                    nueva_particion.append(frozenset(miembros))

            particiones = nueva_particion
            iteracion += 1

        tracer.log("\nSe alcanzó el punto fijo (P_k = P_k-1). No hay más refinamientos posibles.")
        tracer.log_etapa("Etapa 4: Construcción del AFD Mínimo")

        # 4. Construcción del AFD Mínimo
        afd_min = Automata(afd_limpio.alfabeto)
        mapeo_nuevo_id: Dict[str, str] = {}

        for grupo in particiones:
            id_minimo = "M_" + "_".join(sorted(list(grupo)))
            es_ini = any(afd_limpio.estados[q].es_inicial for q in grupo)
            es_fin = any(q in afd_limpio.estados_finales for q in grupo)

            afd_min.agregar_estado(
                id_estado=id_minimo,
                es_inicial=es_ini,
                es_final=es_fin,
                sub_estados=grupo
            )
            tracer.log_mapeo_estado(set(grupo), id_minimo, es_fin, es_inicial=es_ini)
            for q in grupo:
                mapeo_nuevo_id[q] = id_minimo

        # Transiciones del autómata mínimo
        for grupo in particiones:
            representante = next(iter(grupo))
            origen_min = mapeo_nuevo_id[representante]

            for simbolo in sorted(list(afd_limpio.alfabeto.simbolos)):
                dests = afd_limpio.obtener_transiciones_desde(representante, simbolo)
                if dests:
                    dest = next(iter(dests))
                    destino_min = mapeo_nuevo_id[dest]
                    afd_min.agregar_transicion(origen_min, simbolo, destino_min)
                    tracer.log(f"  Transición mínima: δ({origen_min}, '{simbolo}') = {destino_min}")

        tracer.log(f"AFD Mínimo resultante cuenta con {len(afd_min.estados)} estados.")
        return afd_min, tracer
