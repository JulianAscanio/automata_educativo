"""
Modelo de datos principal para el software educativo de autómatas finitos.
Define las entidades formales de la 5-tupla: M = (Q, Σ, δ, q0, F).
"""

from dataclasses import dataclass, field
from typing import Set, Dict, List, Optional, Tuple, Any, FrozenSet
from enum import Enum
from core.exceptions import AlfabetoError

EPSILON = "ε"

class TipoAutomata(Enum):
    AFD = "Autómata Finito Determinista (AFD)"
    AFND = "Autómata Finito No Determinista (AFND)"
    AFND_EPSILON = "Autómata Finito No Determinista con Transiciones Épsilon (ε-AFND)"

@dataclass(frozen=True)
class Estado:
    """
    Representa un estado formal en Q.
    Para estados macro creados en determinización o minimización,
    sub_estados registra los estados originales que lo componen (RF-10 / RF-13).
    """
    id: str
    es_inicial: bool = False
    es_final: bool = False
    sub_estados: FrozenSet[str] = field(default_factory=frozenset)

    def __repr__(self) -> str:
        return self.id

@dataclass(frozen=True)
class Transicion:
    """Representa una transición individual δ(origen, simbolo) -> destino."""
    origen: str
    simbolo: str
    destino: str

    def __repr__(self) -> str:
        return f"δ({self.origen}, '{self.simbolo}') -> {self.destino}"

class Alfabeto:
    """
    Representa el alfabeto finito Σ (RF-01).
    Valida la unicidad y prohíbe el uso de símbolos reservados.
    """
    def __init__(self, simbolos: List[str]):
        if not simbolos:
            raise AlfabetoError("RF-01 Violado: El alfabeto no puede estar vacío.")

        # Validar duplicados (RF-01)
        if len(simbolos) != len(set(simbolos)):
            duplicados = [s for s in set(simbolos) if simbolos.count(s) > 1]
            raise AlfabetoError(f"RF-01 Violado: El alfabeto contiene símbolos duplicados: {duplicados}")

        if EPSILON in simbolos:
            raise AlfabetoError(f"RF-01 Violado: El símbolo '{EPSILON}' está reservado para transiciones épsilon.")

        for s in simbolos:
            if not isinstance(s, str) or len(s.strip()) == 0:
                raise AlfabetoError("RF-01 Violado: Cada símbolo debe ser una cadena no vacía.")

        self._simbolos: FrozenSet[str] = frozenset(simbolos)

    @property
    def simbolos(self) -> FrozenSet[str]:
        return self._simbolos

    def validar_cadena(self, cadena: str) -> bool:
        return all(char in self._simbolos for char in cadena)

    def validar_simbolo(self, simbolo: str) -> bool:
        return simbolo in self._simbolos or simbolo == EPSILON

    def __iter__(self):
        return iter(sorted(self._simbolos))

    def __repr__(self) -> str:
        return "{" + ", ".join(sorted(self._simbolos)) + "}"

class Automata:
    """
    Representación matemática formal del Autómata Finito.
    Soporta AFD, AFND y ε-AFND.
    """
    def __init__(self, alfabeto: Alfabeto):
        self.alfabeto: Alfabeto = alfabeto
        self.estados: Dict[str, Estado] = {}
        self.estado_inicial: Optional[Estado] = None
        self.estados_finales: Set[str] = set()
        # Matriz de transiciones: origen -> simbolo -> set(destinos)
        self.transiciones: Dict[str, Dict[str, Set[str]]] = {}

    def agregar_estado(self, id_estado: str, es_inicial: bool = False, es_final: bool = False,
                       sub_estados: FrozenSet[str] = frozenset()) -> Estado:
        if id_estado in self.estados:
            raise ValueError(f"El estado '{id_estado}' ya existe en el autómata.")

        if es_inicial and self.estado_inicial is not None:
            raise ValueError(f"Conflicto de estado inicial: '{self.estado_inicial.id}' ya fue asignado.")

        estado = Estado(id=id_estado, es_inicial=es_inicial, es_final=es_final, sub_estados=sub_estados)
        self.estados[id_estado] = estado
        self.transiciones[id_estado] = {}

        if es_inicial:
            self.estado_inicial = estado
        if es_final:
            self.estados_finales.add(id_estado)

        return estado

    def agregar_transicion(self, origen: str, simbolo: str, destino: str) -> None:
        if origen not in self.estados:
            raise KeyError(f"Estado de origen '{origen}' no está registrado.")
        if destino not in self.estados:
            raise KeyError(f"Estado de destino '{destino}' no está registrado.")
        if not self.alfabeto.validar_simbolo(simbolo):
            raise ValueError(f"Símbolo '{simbolo}' no pertenece al alfabeto {self.alfabeto} ni es '{EPSILON}'.")

        if simbolo not in self.transiciones[origen]:
            self.transiciones[origen][simbolo] = set()

        self.transiciones[origen][simbolo].add(destino)

    def obtener_transiciones_desde(self, origen: str, simbolo: str) -> Set[str]:
        return self.transiciones.get(origen, {}).get(simbolo, set())

    def tiene_transiciones_epsilon(self) -> bool:
        return any(EPSILON in self.transiciones.get(e, {}) and len(self.transiciones[e][EPSILON]) > 0
                   for e in self.estados)

    def obtener_todas_las_transiciones(self) -> List[Transicion]:
        resultado = []
        for orig, dict_simbolos in self.transiciones.items():
            for simb, dests in dict_simbolos.items():
                for dest in dests:
                    resultado.append(Transicion(orig, simb, dest))
        return resultado

    def __repr__(self) -> str:
        return (f"Automata(Q={list(self.estados.keys())}, "
                f"Σ={sorted(list(self.alfabeto.simbolos))}, "
                f"q0={self.estado_inicial.id if self.estado_inicial else None}, "
                f"F={sorted(list(self.estados_finales))})")
