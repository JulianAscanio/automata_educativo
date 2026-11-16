"""Casos límite y comparación independiente de lenguajes, con semilla reproducible."""
import itertools
import random
import re
import unittest
from core.models import Alfabeto, Automata
from algorithms.thompson import ThompsonAlgorithm
from algorithms.subset_construction import SubsetConstruction
from algorithms.minimization import DFAMinimizer
from algorithms.simulator import StringSimulator
from bridge import procesar_modalidad_b_py


def words(limit):
    return [''.join(chars) for n in range(limit + 1)
            for chars in itertools.product('ab', repeat=n)]


def accepts_nfa(aut, word):
    pending = [(aut.estado_inicial.id, 0)]
    seen = set()
    while pending:
        q, pos = pending.pop()
        if (q, pos) in seen:
            continue
        seen.add((q, pos))
        if pos == len(word) and q in aut.estados_finales:
            return True
        for t in aut.obtener_todas_las_transiciones():
            if t.origen != q:
                continue
            if t.simbolo == 'ε':
                pending.append((t.destino, pos))
            elif pos < len(word) and t.simbolo == word[pos]:
                pending.append((t.destino, pos + 1))
    return False


class ExtendedTests(unittest.TestCase):
    def test_regex_languages(self):
        expressions = ['(a|b)*ab', '(a|b)*.a.b', 'a*', 'a|b', '(ab)*',
                       'a', 'ab', 'a|ab', '(a|b)*', '(a*)*', 'a*b*',
                       '(a|bb)*', 'a(b|a)*b', '((a|b)(a|b))*']
        for expression in expressions:
            nfa, _ = ThompsonAlgorithm(Alfabeto(['a', 'b'])).construir(expression)
            dfa, _ = SubsetConstruction(nfa).determinizar()
            minimal, _ = DFAMinimizer.minimizar(dfa)
            for word in words(7):
                with self.subTest(expression=expression, word=word):
                    expected = re.fullmatch(expression.replace('.', ''), word) is not None
                    self.assertEqual(StringSimulator.simular(minimal, word)[0], expected)

    def test_generated_nfa(self):
        rng = random.Random(20261115)
        for case in range(100):
            aut = Automata(Alfabeto(['a', 'b']))
            names = ['start', 'A_B', 'A', 'B', 'pozo']
            for i, q in enumerate(names):
                aut.agregar_estado(q, es_inicial=i == 0, es_final=rng.random() < .4)
            for q, symbol, dest in itertools.product(names, ['a', 'b', 'ε'], names):
                if rng.random() < .12:
                    aut.agregar_transicion(q, symbol, dest)
            before = list(aut.obtener_todas_las_transiciones())
            dfa, _ = SubsetConstruction(aut).determinizar()
            minimal, _ = DFAMinimizer.minimizar(dfa)
            self.assertEqual(aut.obtener_todas_las_transiciones(), before)
            for word in words(5):
                with self.subTest(case=case, word=word):
                    expected = accepts_nfa(aut, word)
                    self.assertEqual(StringSimulator.simular(dfa, word)[0], expected)
                    self.assertEqual(StringSimulator.simular(minimal, word)[0], expected)
            for q, symbol in itertools.product(minimal.estados, ['a', 'b']):
                self.assertEqual(len(minimal.obtener_transiciones_desde(q, symbol)), 1)
            again, _ = DFAMinimizer.minimizar(minimal)
            self.assertEqual(len(again.estados), len(minimal.estados))

    def test_colliding_state_names(self):
        for special in ['A_B', 'A,B']:
            aut = Automata(Alfabeto(['a', 'b']))
            for q in ['start', special, 'A', 'B']:
                aut.agregar_estado(q, es_inicial=q == 'start', es_final=q == 'B')
            for t in [('start', 'a', special), ('start', 'b', 'A'), ('start', 'b', 'B')]:
                aut.agregar_transicion(*t)
            dfa, _ = SubsetConstruction(aut).determinizar()
            self.assertEqual(len(dfa.estados), 3)
            self.assertFalse(StringSimulator.simular(dfa, 'a')[0])
            self.assertTrue(StringSimulator.simular(dfa, 'b')[0])

    def test_manual_invalid_inputs(self):
        cases = [('', 'A,B', 'A', 'B', []), ('a,a', 'A,B', 'A', 'B', []),
                 ('ε', 'A,B', 'A', 'B', []), ('a', '', 'A', '', []),
                 ('a', 'A,A', 'A', '', []), ('a', 'A,B', 'Z', '', []),
                 ('a', 'A,B', 'A', 'Z', [])]
        for t in [('Z', 'a', 'B'), ('A', 'a', 'Z'), ('A', 'x', 'B')]:
            cases.append(('a', 'A,B', 'A', 'B', [dict(zip(['origen', 'simbolo', 'destino'], t))]))
        for args in cases:
            with self.subTest(args=args), self.assertRaises(Exception):
                procesar_modalidad_b_py(*args)
        # F vacío es válido y representa lenguaje vacío.
        result = procesar_modalidad_b_py('a', 'A,B', 'A', '', [])
        self.assertTrue(result['exito'])
        self.assertEqual(len(result['automataMinimo']['estados']), 1)

    def test_aliases_and_whitespace(self):
        for expression in ['a+b', 'aUb', 'a∪b', ' a \t | \n b ']:
            nfa, _ = ThompsonAlgorithm(Alfabeto(['a', 'b'])).construir(expression)
            dfa, _ = SubsetConstruction(nfa).determinizar()
            for word, expected in [('', False), ('a', True), ('b', True), ('ab', False)]:
                self.assertEqual(StringSimulator.simular(dfa, word)[0], expected)

    def test_empty_word_and_partial_dfa(self):
        aut = Automata(Alfabeto(['a']))
        aut.agregar_estado('q', es_inicial=True, es_final=True)
        self.assertTrue(StringSimulator.simular(aut, '')[0])
        self.assertFalse(StringSimulator.simular(aut, 'a')[0])
        self.assertFalse(StringSimulator.simular(aut, 'x')[0])
        minimal, _ = DFAMinimizer.minimizar(aut)
        self.assertEqual(len(minimal.estados), 2)
