"""
Script de validación automática para los 3 casos de prueba académicos (100% Python).
"""
import sys
from core.models import Alfabeto, Automata, EPSILON
from algorithms.regex_parser import RegexParser
from algorithms.thompson import ThompsonAlgorithm
from algorithms.classifier import AutomataClassifier
from algorithms.subset_construction import SubsetConstruction
from algorithms.reachability import ReachabilityCleaner
from algorithms.minimization import DFAMinimizer
from algorithms.simulator import StringSimulator

def test_caso_1():
    print("\n==================== TEST CASO 1: Modalidad A (Regex) ====================")
    alfa = Alfabeto(["a", "b"])
    thompson = ThompsonAlgorithm(alfa)
    nfa, tracer_t = thompson.construir("(a|b)*ab")
    print(f"[OK] Thompson generado con {len(nfa.estados)} estados.")

    subset = SubsetConstruction(nfa)
    dfa, tracer_s = subset.determinizar()
    print(f"[OK] AFD Determinizado con {len(dfa.estados)} estados.")

    min_dfa, tracer_m = DFAMinimizer.minimizar(dfa)
    print(f"[OK] AFD Mínimo con {len(min_dfa.estados)} estados. Estados finales: {min_dfa.estados_finales}")
    assert len(min_dfa.estados) == 3, f"Esperado 3 estados en AFD mínimo, obtenido {len(min_dfa.estados)}"

    # Probar simulación RF-12
    ok_aab, _, _ = StringSimulator.simular(min_dfa, "aab")
    ok_aba, _, _ = StringSimulator.simular(min_dfa, "aba")
    assert ok_aab is True, "Error: 'aab' debe ser aceptada por (a|b)*ab"
    assert ok_aba is False, "Error: 'aba' debe ser rechazada por (a|b)*ab"
    print("[OK] Simulación RF-12 validada: 'aab' aceptada, 'aba' rechazada.")
    print("CASO 1 APROBADO CON ÉXITO.")

def test_caso_2():
    print("\n==================== TEST CASO 2: Modalidad B (AFND con ε) ====================")
    alfa = Alfabeto(["0", "1"])
    aut = Automata(alfa)
    aut.agregar_estado("A", es_inicial=True)
    aut.agregar_estado("B")
    aut.agregar_estado("C", es_final=True)

    aut.agregar_transicion("A", EPSILON, "B")
    aut.agregar_transicion("A", "0", "A")
    aut.agregar_transicion("B", "1", "C")
    aut.agregar_transicion("C", "0", "C")

    tipo, razones = AutomataClassifier.clasificar(aut)
    print(f"[OK] Tipo detectado: {tipo.value}")
    assert "ε-AFND" in tipo.value

    subset = SubsetConstruction(aut)
    dfa, tracer_s = subset.determinizar()
    print(f"[OK] AFD Determinizado con {len(dfa.estados)} estados.")

    min_dfa, tracer_m = DFAMinimizer.minimizar(dfa)
    print(f"[OK] AFD Mínimo con {len(min_dfa.estados)} estados.")

    # Probar simulación RF-12
    ok_0010, _, _ = StringSimulator.simular(min_dfa, "0010")
    ok_11, _, _ = StringSimulator.simular(min_dfa, "11")
    assert ok_0010 is True, "Error: '0010' debe ser aceptada"
    assert ok_11 is False, "Error: '11' debe ser rechazada"
    print("[OK] Simulación RF-12 validada: '0010' aceptada, '11' rechazada.")
    print("CASO 2 APROBADO CON ÉXITO.")

def test_caso_3():
    print("\n==================== TEST CASO 3: Modalidad B (AFD Redundante) ====================")
    alfa = Alfabeto(["a", "b"])
    aut = Automata(alfa)
    for q in ["A", "B", "C", "D", "E"]:
        aut.agregar_estado(q, es_inicial=(q == "A"), es_final=(q in {"C", "D"}))

    aut.agregar_transicion("A", "a", "B")
    aut.agregar_transicion("A", "b", "E")
    aut.agregar_transicion("B", "a", "C")
    aut.agregar_transicion("B", "b", "D")
    aut.agregar_transicion("C", "a", "C")
    aut.agregar_transicion("C", "b", "D")
    aut.agregar_transicion("D", "a", "D")
    aut.agregar_transicion("D", "b", "C")
    aut.agregar_transicion("E", "a", "E")
    aut.agregar_transicion("E", "b", "E")

    tipo, _ = AutomataClassifier.clasificar(aut)
    print(f"[OK] Tipo detectado: {tipo.value}")
    assert "Determinista (AFD)" in tipo.value

    min_dfa, tracer_m = DFAMinimizer.minimizar(aut)
    print(f"[OK] AFD Mínimo con {len(min_dfa.estados)} estados (C y D fusionados).")
    assert len(min_dfa.estados) == 4, f"Esperado 4 estados en AFD mínimo, obtenido {len(min_dfa.estados)}"
    print("CASO 3 APROBADO CON ÉXITO.")

if __name__ == "__main__":
    test_caso_1()
    test_caso_2()
    test_caso_3()
    print("\n>>> TODOS LOS CASOS DE PRUEBA ACADÉMICOS EN PYTHON HAN SIDO VALIDADOS EXITOSAMENTE <<<")
