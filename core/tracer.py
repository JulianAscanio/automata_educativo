"""
Módulo de Trazabilidad Pedagógica (RF-10, RF-13).
Registra detalladamente cada fase, transformación, fusión de estados y decisiones tomadas
durante la ejecución de los algoritmos para su visualización educativa.
"""

from typing import List, Dict, Any, Optional

class PedagogicalTracer:
    def __init__(self, titulo_proceso: str):
        self.titulo_proceso = titulo_proceso
        self.registros: List[Dict[str, Any]] = []

    def log(self, mensaje: str, categoria: str = "INFO", detalle: Optional[Dict[str, Any]] = None) -> None:
        """Registra un evento pedagógico con contexto."""
        self.registros.append({
            "categoria": categoria,
            "mensaje": mensaje,
            "detalle": detalle or {}
        })

    def log_etapa(self, nombre_etapa: str) -> None:
        """Marca el inicio de una sub-etapa formativa."""
        self.registros.append({
            "categoria": "ETAPA",
            "mensaje": f"--- {nombre_etapa} ---",
            "detalle": {}
        })

    def log_mapeo_estado(self, subconjunto: set, nuevo_id: str, es_final: bool, es_inicial: bool = False) -> None:
        """RF-10/RF-13: Registra la correspondencia formal de estados."""
        desc_tipo = []
        if es_inicial:
            desc_tipo.append("Inicial")
        if es_final:
            desc_tipo.append("Final/Aceptación")
        if not desc_tipo:
            desc_tipo.append("No Final")

        sub_str = "{" + ", ".join(sorted(list(subconjunto))) + "}"
        self.log(
            f"Mapeo de estados: Subconjunto original {sub_str} -> Nuevo Macro-Estado '{nuevo_id}' "
            f"[{', '.join(desc_tipo)}]",
            categoria="MAPEO",
            detalle={"subconjunto": list(subconjunto), "nuevo_id": nuevo_id, "tipo": desc_tipo}
        )

    def obtener_bitacora_texto(self) -> str:
        """Devuelve toda la bitácora pedagógica formateada en texto legible."""
        lineas = [f"==================== {self.titulo_proceso} ===================="]
        for reg in self.registros:
            cat = reg["categoria"]
            msg = reg["mensaje"]
            if cat == "ETAPA":
                lineas.append(f"\n{msg}")
            elif cat == "MAPEO":
                lineas.append(f"  [Mapeo] {msg}")
            elif cat == "ADVERTENCIA":
                lineas.append(f"  [!] {msg}")
            else:
                lineas.append(f"  * {msg}")
        lineas.append("==================================================================")
        return "\n".join(lineas)

    def imprimir_bitacora(self) -> None:
        print(self.obtener_bitacora_texto())
