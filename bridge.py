"""
bridge.py
Interfaz unificada en Python que serializa las estructuras de datos y resultados
para cualquier frontend (Web, Pyodide, Netlify Functions o Desktop GUI).
"""

import json
from typing import Dict, Any, List
from core.models import Alfabeto, Automata, EPSILON
from core.tracer import PedagogicalTracer
from algorithms.regex_parser import RegexParser
from algorithms.thompson import ThompsonAlgorithm
from algorithms.classifier import AutomataClassifier
from algorithms.subset_construction import SubsetConstruction
from algorithms.reachability import ReachabilityCleaner
from algorithms.minimization import DFAMinimizer
from algorithms.simulator import StringSimulator

def automata_a_dict(automata: Automata) -> Dict[str, Any]:
    estados_lista = []
    for q_id, est in automata.estados.items():
        estados_lista.append({
            "id": q_id,
            "esInicial": est.es_inicial,
            "esFinal": est.es_final,
            "subEstados": sorted(list(est.sub_estados)) if est.sub_estados else []
        })

    transiciones_lista = []
    for t in automata.obtener_todas_las_transiciones():
        transiciones_lista.append({
            "origen": t.origen,
            "simbolo": t.simbolo,
            "destino": t.destino
        })

    # Generar tabla de transición
    simbolos = sorted(list(automata.alfabeto.simbolos))
    if automata.tiene_transiciones_epsilon():
        simbolos.append(EPSILON)

    tabla_filas = []
    for q_id, est in automata.estados.items():
        celdas = {}
        for s in simbolos:
            dests = sorted(list(automata.obtener_transiciones_desde(q_id, s)))
            celdas[s] = "{" + ", ".join(dests) + "}" if len(dests) > 1 else (dests[0] if dests else "—")
        tabla_filas.append({
            "estado": {
                "id": q_id,
                "esInicial": est.es_inicial,
                "esFinal": est.es_final,
                "subEstados": sorted(list(est.sub_estados)) if est.sub_estados else []
            },
            "celdas": celdas
        })

    return {
        "estados": estados_lista,
        "alfabeto": sorted(list(automata.alfabeto.simbolos)),
        "estadoInicial": automata.estado_inicial.id if automata.estado_inicial else None,
        "estadosFinales": sorted(list(automata.estados_finales)),
        "transiciones": transiciones_lista,
        "tabla": {
            "columnas": simbolos,
            "filas": tabla_filas
        }
    }

def tracer_a_dict(tracer: PedagogicalTracer) -> Dict[str, Any]:
    return {
        "titulo": tracer.titulo_proceso,
        "registros": tracer.registros
    }

def procesar_modalidad_a_py(alfa_str: str, regex_str: str) -> Dict[str, Any]:
    simbolos = [s.strip() for s in alfa_str.split(",") if s.strip()]
    alfabeto = Alfabeto(simbolos)

    # 1. Thompson (Regex -> ε-AFND)
    thompson = ThompsonAlgorithm(alfabeto)
    nfa, tracer_t = thompson.construir(regex_str)

    # 2. Clasificador RF-05
    tipo, razones = AutomataClassifier.clasificar(nfa)

    # 3. Determinización (Subset Construction RF-06)
    subset = SubsetConstruction(nfa)
    dfa, tracer_s = subset.determinizar()

    # 4. Minimización (RF-09 & RF-07)
    dfa_minimo, tracer_m = DFAMinimizer.minimizar(dfa)

    return {
        "exito": True,
        "automataInicial": automata_a_dict(nfa),
        "clasificacion": {
            "tipo": tipo.value,
            "esDeterminista": False,
            "razones": razones
        },
        "automataDFA": automata_a_dict(dfa),
        "automataMinimo": automata_a_dict(dfa_minimo),
        "tracerThompson": tracer_a_dict(tracer_t),
        "tracerSubconjuntos": tracer_a_dict(tracer_s),
        "tracerMinimizacion": tracer_a_dict(tracer_m)
    }

def procesar_modalidad_b_py(alfa_str: str, estados_str: str, inicial_str: str,
                             finales_str: str, transiciones_list: List[Dict[str, str]]) -> Dict[str, Any]:
    simbolos = [s.strip() for s in alfa_str.split(",") if s.strip()]
    alfabeto = Alfabeto(simbolos)
    aut = Automata(alfabeto)

    estados = [e.strip() for e in estados_str.split(",") if e.strip()]
    inicial = inicial_str.strip()
    finales = {f.strip() for f in finales_str.split(",") if f.strip()}

    if inicial not in estados:
        raise ValueError(f"El estado inicial '{inicial}' no está en el conjunto de estados Q.")

    for e in estados:
        aut.agregar_estado(e, es_inicial=(e == inicial), es_final=(e in finales))

    for t in transiciones_list:
        aut.agregar_transicion(t["origen"].strip(), t["simbolo"].strip(), t["destino"].strip())

    # RF-05: Clasificador
    tipo, razones = AutomataClassifier.clasificar(aut)
    es_afd = "Determinista (AFD)" in tipo.value

    tracer_s = None
    dfa_intermedio = None

    if not es_afd:
        subset = SubsetConstruction(aut)
        dfa_intermedio, tracer_s = subset.determinizar()
        aut_para_minimizar = dfa_intermedio
    else:
        aut_para_minimizar = aut

    # Minimización (RF-09 & RF-07)
    dfa_minimo, tracer_m = DFAMinimizer.minimizar(aut_para_minimizar)

    return {
        "exito": True,
        "automataInicial": automata_a_dict(aut),
        "clasificacion": {
            "tipo": tipo.value,
            "esDeterminista": es_afd,
            "razones": razones
        },
        "automataDFA": automata_a_dict(dfa_intermedio) if dfa_intermedio else None,
        "automataMinimo": automata_a_dict(dfa_minimo),
        "tracerThompson": None,
        "tracerSubconjuntos": tracer_a_dict(tracer_s) if tracer_s else None,
        "tracerMinimizacion": tracer_a_dict(tracer_m)
    }

def simular_cadena_py(automata_dict: Dict[str, Any], cadena: str) -> Dict[str, Any]:
    # Reconstruir automata para simular
    alfa = Alfabeto(automata_dict["alfabeto"])
    aut = Automata(alfa)
    for est in automata_dict["estados"]:
        aut.agregar_estado(est["id"], es_inicial=est["esInicial"], es_final=est["esFinal"])
    for t in automata_dict["transiciones"]:
        aut.agregar_transicion(t["origen"], t["simbolo"], t["destino"])

    aceptada, pasos, msg = StringSimulator.simular(aut, cadena)
    return {
        "aceptada": aceptada,
        "pasos": pasos,
        "mensajeFinal": msg
    }
