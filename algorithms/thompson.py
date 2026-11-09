"""
Construcción de Thompson (Modalidad A).
Convierte una expresión regular en postfija a un ε-AFND formal.
"""

from typing import List, Tuple
from core.models import Automata, Estado, Alfabeto, EPSILON
from core.tracer import PedagogicalTracer
from core.exceptions import RegexSyntaxError
from algorithms.regex_parser import RegexParser

class FragmentoThompson:
    """Representa una caja de Thompson con estado de entrada y estado de salida."""
    def __init__(self, entrada: str, salida: str):
        self.entrada = entrada
        self.salida = salida

class ThompsonAlgorithm:
    def __init__(self, alfabeto: Alfabeto):
        self.alfabeto = alfabeto
        self.parser = RegexParser(alfabeto)

    def construir(self, regex: str) -> Tuple[Automata, PedagogicalTracer]:
        tracer = PedagogicalTracer("CONSTRUCCIÓN DE THOMPSON (Regex -> ε-AFND)")
        postfija = self.parser.a_postfija(regex)
        tracer.log(f"Expresión regular original: '{regex}'")
        tracer.log(f"Expresión regular postfija evaluada: '{postfija}'")

        automata = Automata(self.alfabeto)
        contador = 0

        def nuevo_estado() -> str:
            nonlocal contador
            q_id = f"s{contador}"
            contador += 1
            automata.agregar_estado(q_id)
            return q_id

        pila: List[FragmentoThompson] = []

        for token in postfija:
            if token in self.alfabeto.simbolos:
                s_in, s_out = nuevo_estado(), nuevo_estado()
                automata.agregar_transicion(s_in, token, s_out)
                pila.append(FragmentoThompson(s_in, s_out))
                tracer.log(f"Símbolo '{token}': Creado fragmento básico {s_in} --({token})--> {s_out}")

            elif token == '.':
                if len(pila) < 2:
                    raise RegexSyntaxError("Error en evaluación postfija: operandos insuficientes para concatenación.")
                f2 = pila.pop()
                f1 = pila.pop()
                automata.agregar_transicion(f1.salida, EPSILON, f2.entrada)
                pila.append(FragmentoThompson(f1.entrada, f2.salida))
                tracer.log(f"Concatenación (.): Conectado {f1.salida} --(ε)--> {f2.entrada}")

            elif token == '|':
                if len(pila) < 2:
                    raise RegexSyntaxError("Error en evaluación postfija: operandos insuficientes para unión.")
                f2 = pila.pop()
                f1 = pila.pop()
                s_in, s_out = nuevo_estado(), nuevo_estado()
                automata.agregar_transicion(s_in, EPSILON, f1.entrada)
                automata.agregar_transicion(s_in, EPSILON, f2.entrada)
                automata.agregar_transicion(f1.salida, EPSILON, s_out)
                automata.agregar_transicion(f2.salida, EPSILON, s_out)
                pila.append(FragmentoThompson(s_in, s_out))
                tracer.log(f"Unión (|): Creada bifurcación desde {s_in} hacia {f1.entrada} y {f2.entrada}, unificando en {s_out}")

            elif token == '*':
                if len(pila) < 1:
                    raise RegexSyntaxError("Error en evaluación postfija: operando insuficiente para cerradura de Kleene.")
                f = pila.pop()
                s_in, s_out = nuevo_estado(), nuevo_estado()
                automata.agregar_transicion(s_in, EPSILON, f.entrada)
                automata.agregar_transicion(s_in, EPSILON, s_out)
                automata.agregar_transicion(f.salida, EPSILON, f.entrada)
                automata.agregar_transicion(f.salida, EPSILON, s_out)
                pila.append(FragmentoThompson(s_in, s_out))
                tracer.log(f"Cerradura Kleene (*): Bucle añadido sobre {f.entrada}->{f.salida} con bypass {s_in}->{s_out}")

        if len(pila) != 1:
            raise RegexSyntaxError("Error interno: la pila de fragmentos contiene múltiples elementos no reducidos.")

        frag_final = pila.pop()

        # Establecer inicial y final formalmente
        e_in = automata.estados[frag_final.entrada]
        automata.estados[frag_final.entrada] = Estado(id=e_in.id, es_inicial=True, es_final=False)
        automata.estado_inicial = automata.estados[frag_final.entrada]

        e_out = automata.estados[frag_final.salida]
        automata.estados[frag_final.salida] = Estado(id=e_out.id, es_inicial=False, es_final=True)
        automata.estados_finales.add(e_out.id)

        tracer.log(f"Autómata ε-AFND construido exitosamente. Estado Inicial: {e_in.id}, Estados Finales: {sorted(list(automata.estados_finales))}")
        return automata, tracer
