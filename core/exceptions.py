"""
Excepciones personalizadas del dominio de autómatas finitos.
"""

class AutomataError(Exception):
    """Excepción base para errores del sistema de autómatas."""
    pass

class AlfabetoError(AutomataError):
    """Errores relacionados con la validación y composición del alfabeto (RF-01)."""
    pass

class RegexSyntaxError(AutomataError):
    """Errores de sintaxis o símbolos foráneos en la expresión regular (RF-02)."""
    pass

class DeterminismError(AutomataError):
    """Errores al intentar operaciones de AFD sobre autómatas no deterministas."""
    pass

class SimulationError(AutomataError):
    """Errores durante la simulación de cadenas de entrada (RF-12)."""
    pass
