"""Regresiones de validación y minimización del motor Python."""
import unittest
from core.models import Alfabeto, Automata
from algorithms.regex_parser import RegexParser
from algorithms.minimization import DFAMinimizer
from algorithms.simulator import StringSimulator
from bridge import procesar_modalidad_b_py


class RegressionTests(unittest.TestCase):
    def test_unknown_final_state(self):
        with self.assertRaisesRegex(ValueError, 'Z'):
            procesar_modalidad_b_py('a', 'A,B', 'A', 'Z', [])

    def test_simulator_rejects_nondeterminism(self):
        for symbol in ['ε', 'a']:
            automaton = Automata(Alfabeto(['a']))
            automaton.agregar_estado('A', es_inicial=True)
            automaton.agregar_estado('B', es_final=True)
            automaton.agregar_transicion('A', symbol, 'A')
            automaton.agregar_transicion('A', symbol, 'B')
            with self.assertRaisesRegex(ValueError, 'no determinista'):
                StringSimulator.simular(automaton, 'a')

    def test_explicit_concatenation(self):
        parser = RegexParser(Alfabeto(['a', 'b']))
        self.assertEqual(parser.a_postfija('a.b'), parser.a_postfija('ab'))

    def test_invalid_syntax(self):
        parser = RegexParser(Alfabeto(['a', 'b']))
        for expression in ['a|', '|a', '*a', '()', 'a()b', 'a..b', '(a', 'a)']:
            with self.subTest(expression=expression), self.assertRaises(Exception):
                parser.a_postfija(expression)

    def test_partial_empty_language(self):
        automaton = Automata(Alfabeto(['a', 'b']))
        automaton.agregar_estado('initial', es_inicial=True)
        automaton.agregar_estado('dead')
        automaton.agregar_estado('unreachable', es_final=True)
        automaton.agregar_transicion('initial', 'a', 'dead')
        minimal, _ = DFAMinimizer.minimizar(automaton)
        self.assertEqual(len(minimal.estados), 1)
        self.assertEqual(len(automaton.estados), 3)
        for symbol in ['a', 'b']:
            self.assertEqual(len(minimal.obtener_transiciones_desde(minimal.estado_inicial.id, symbol)), 1)

    def test_nondeterministic_input(self):
        automaton = Automata(Alfabeto(['a']))
        automaton.agregar_estado('initial', es_inicial=True)
        automaton.agregar_estado('final', es_final=True)
        automaton.agregar_transicion('initial', 'ε', 'final')
        with self.assertRaises(ValueError):
            DFAMinimizer.minimizar(automaton)
