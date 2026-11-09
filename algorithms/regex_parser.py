"""
Módulo de Análisis y Parsing de Expresiones Regulares.
Implementa el algoritmo Shunting-Yard para convertir expresiones regulares infijas a postfijas
cumpliendo con la validación de pertenencia al alfabeto (RF-02).
"""

from typing import List
from core.models import Alfabeto
from core.exceptions import RegexSyntaxError

class RegexParser:
    OPERADORES = {'|', '*', '(', ')'}
    PRECEDENCIA = {'*': 3, '.': 2, '|': 1}

    def __init__(self, alfabeto: Alfabeto):
        self.alfabeto = alfabeto

    def normalizar_y_validar(self, regex: str) -> str:
        """
        RF-02: Valida que los símbolos pertenezcan al alfabeto
        e inserta explícitamente el operador de concatenación ('.').
        """
        regex = regex.strip().strip("'\"")
        regex = regex.replace(" ", "")
        if not regex:
            raise RegexSyntaxError("La expresión regular no puede estar vacía.")

        # Permitir operadores habituales de unión (+, U, ∪) como alias de | si no están en Σ
        if '+' not in self.alfabeto.simbolos:
            regex = regex.replace('+', '|')
        if 'U' not in self.alfabeto.simbolos:
            regex = regex.replace('U', '|')
        regex = regex.replace('∪', '|')

        # Validar símbolos
        for c in regex:
            if c not in self.alfabeto.simbolos and c not in self.OPERADORES:
                simbolos_disp = sorted(list(self.alfabeto.simbolos))
                raise RegexSyntaxError(
                    f"RF-02 Violado: Símbolo '{c}' en la expresión regular no pertenece al alfabeto {simbolos_disp} ni es un operador permitido (| * ( ))."
                )

        # Inserción de concatenación explícita
        con_concatenacion: List[str] = []
        for i in range(len(regex)):
            c1 = regex[i]
            con_concatenacion.append(c1)

            if i + 1 < len(regex):
                c2 = regex[i + 1]
                # Inserta '.' entre:
                # 1. símbolo y símbolo: ab -> a.b
                # 2. '*' y símbolo: a*b -> a*.b
                # 3. ')' y símbolo: (a)b -> (a).b
                # 4. símbolo y '(': a(b) -> a.(b)
                # 5. '*' y '(': a*(b) -> a*.(b)
                # 6. ')' y '(': (a)(b) -> (a).(b)
                if (c1 in self.alfabeto.simbolos or c1 in {'*', ')'}) and \
                   (c2 in self.alfabeto.simbolos or c2 == '('):
                    con_concatenacion.append('.')

        return "".join(con_concatenacion)

    def a_postfija(self, regex: str) -> str:
        """
        Algoritmo Shunting-Yard de Dijkstra para expresiones regulares.
        Retorna la expresión en notación postfija.
        """
        cadena_normalizada = self.normalizar_y_validar(regex)
        salida: List[str] = []
        pila: List[str] = []

        for token in cadena_normalizada:
            if token in self.alfabeto.simbolos:
                salida.append(token)
            elif token == '(':
                pila.append(token)
            elif token == ')':
                while pila and pila[-1] != '(':
                    salida.append(pila.pop())
                if not pila:
                    raise RegexSyntaxError("Paréntesis desbalanceados: se encontró ')' sin apertura correspondiente.")
                pila.pop()  # Retira '('
            elif token in self.PRECEDENCIA:
                while (pila and pila[-1] != '(' and 
                       self.PRECEDENCIA.get(pila[-1], 0) >= self.PRECEDENCIA.get(token, 0)):
                    salida.append(pila.pop())
                pila.append(token)
            else:
                raise RegexSyntaxError(f"Operador no soportado: '{token}'")

        while pila:
            op = pila.pop()
            if op in {'(', ')'}:
                raise RegexSyntaxError("Paréntesis desbalanceados al final de la expresión.")
            salida.append(op)

        return "".join(salida)
