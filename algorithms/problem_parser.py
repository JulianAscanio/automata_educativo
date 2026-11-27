"""
algorithms/problem_parser.py
Intérpretes de enunciados en lenguaje natural para Modalidad A (lenguaje regular)
y Modalidad B (autómata finito), equivalentes a languageProblem.ts y automataProblem.ts.
"""

import re
import unicodedata
from typing import Dict, List, Optional, Tuple
from core.models import EPSILON


EJEMPLOS_ENUNCIADOS: List[Tuple[str, str]] = [
    ("Termina en 01", "Diseñar un AFD que acepte las cadenas binarias que terminen en 01."),
    ("Inicio y final", "Construir un autómata sobre {a, b} para las cadenas que empiecen con a y terminen en b."),
    ("Penúltimo símbolo", "Cadenas binarias cuyo penúltimo símbolo es 1."),
    ("Cantidad par de 1", "Cadenas binarias que tengan una cantidad par de 1."),
    ("Al menos dos a", "Cadenas sobre {a, b} que contengan al menos dos a."),
    ("Longitud múltiplo de 3", "Cadenas sobre {a, b} de longitud múltiplo de 3."),
]

EJEMPLO_AUTOMATA = (
    "Analiza un autómata con estado inicial A y estado final C. "
    "Desde A con epsilon va a B. Desde A con 0 vuelve a A. "
    "Desde B con 1 va a C. Desde C con 0 vuelve a C."
)

_PALABRA = r'["“\'‘]?[a-zA-Z0-9]+["”\'’]?'
_INICIO = r"(?:empiezan|empiecen|comienzan|comiencen|inician|inicien) (?:con|por|en)"
_FINAL = r"(?:terminan|terminen|acaban|acaben|finalizan|finalicen) (?:en|con|por)"
_CONTIENE = r"(?:contienen|contengan|incluyen|incluyan)(?: (?:la subcadena|el patr[oó]n|la secuencia))?"

_NUMERALES: Dict[str, int] = {
    "cero": 0, "un": 1, "uno": 1, "una": 1,
    "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5, "seis": 6,
}

_PALABRAS_RESERVADAS = {
    "que", "con", "por", "en", "de", "la", "el", "los", "las", "un", "una", "y", "o", "no",
    "empiezan", "empiecen", "comienzan", "comiencen", "inician", "inicien",
    "terminan", "terminen", "acaban", "acaben", "finalizan", "finalicen",
    "contienen", "contengan", "incluyen", "incluyan", "tienen", "tengan", "son", "sean",
    "subcadena", "patron", "patrón", "secuencia", "longitud", "simbolo", "símbolo",
    "simbolos", "símbolos", "par", "impar", "cantidad", "numero", "número",
    "penultimo", "penúltimo", "antepenultimo", "antepenúltimo", "ultimo", "último",
    "primer", "primero", "segundo", "es", "al", "menos", "exactamente", "multiplo", "múltiplo",
    "divisible", "apariciones", "veces", "cualquier", "combinacion", "combinación",
    "cero", "ceros", "uno", "unos", "dos", "tres", "cuatro", "cinco", "seis",
}


def _parsear_numero(valor: str) -> Optional[int]:
    limpio = valor.lower().strip()
    if limpio in _NUMERALES:
        return _NUMERALES[limpio]
    return int(limpio) if limpio.isdigit() else None


def _normalizar_simbolo_conteo(raw: str) -> str:
    s = re.sub(r'^["“\'‘]|["”\'’]$', "", raw).strip()
    lower = s.lower()
    if lower in {"cero", "ceros", "0s", "0's"}:
        return "0"
    if lower in {"uno", "unos", "1s", "1's"}:
        return "1"
    if re.match(r"^[a-zA-Z0-9]'?s$", s) and len(s) >= 2:
        return s[0]
    return s


def _extraer_alfabeto(texto: str) -> Tuple[Optional[List[str]], str, Optional[str]]:
    llave_re = re.compile(r"(?:(?:sobre|con|del|en el)\s+)?(?:(?:el\s+)?alfabeto\s+)?(?:Σ\s*=\s*)?\{([^{}]+)\}", re.IGNORECASE)
    m = llave_re.search(texto)
    if m:
        simbolos = [
            s.strip().strip("'\"")
            for s in re.split(r"[\s,]+", m.group(1))
            if s.strip().strip("'\"")
        ]
        resto = re.sub(r"\s+", " ", texto[:m.start()] + " " + texto[m.end():]).strip()
        return simbolos, resto, "explicito"

    bin_re = re.compile(r"\b(?:binarias|binarios|de bits|de ceros y unos|de 0 y 1)\b", re.IGNORECASE)
    mb = bin_re.search(texto)
    if mb:
        resto = re.sub(r"\s+", " ", texto[:mb.start()] + " " + texto[mb.end():]).strip()
        return ["0", "1"], resto, "binario"

    return None, texto, None


def _limpiar_preambulo(texto: str) -> str:
    limpio = re.sub(r"\s+", " ", unicodedata.normalize("NFC", texto.strip())).rstrip(".")
    limpio = re.sub(r"^(?:(?:problema|enunciado|ejercicio)\s*\d*\s*[:.-]|\d+[.)]|[a-z]\))\s*", "", limpio, flags=re.IGNORECASE)
    limpio = re.sub(
        r"^(?:(?:diseñar|diseña|diseñe|construir|construye|construya|generar|genera|genere|crear|crea|cree|"
        r"hacer|haz|haga|realizar|realiza|realice|elaborar|elabora|elabore|obtener|obtén|obtenga|"
        r"hallar|halla|halle|encontrar|encuentra|encuentre|definir|define|defina|modelar|modela|modele)"
        r"\s+(?:un|una|el|la)?\s*(?:afd|afnd|afn|autómata(?:\s+finito(?:\s+(?:determinista|no\s+determinista))?)?|"
        r"lenguaje|expresión\s+regular)\s+(?:para(?:\s+(?:aceptar|reconocer))?|que\s+(?:acepte|reconozca|genere|represente)|de|sobre)?\s*)",
        "",
        limpio,
        flags=re.IGNORECASE,
    )
    limpio = re.sub(
        r"^(?:el\s+lenguaje\s+(?:de|formado\s+por)\s+)?(?:(?:todas\s+)?las\s+)?(?:cadenas|palabras|secuencias|hileras)\s*",
        "",
        limpio,
        flags=re.IGNORECASE,
    )
    return limpio.strip()


def _inferir_alfabeto(condicion: str) -> Optional[List[str]]:
    literales = re.findall(r"\b[a-zA-Z0-9]+\b", condicion)
    chars = set()
    for tok in literales:
        if tok.lower() in _PALABRAS_RESERVADAS:
            continue
        if re.fullmatch(r"[01]+", tok):
            chars.update(["0", "1"])
        elif re.fullmatch(r"[a-zA-Z]+", tok) and len(tok) <= 6:
            chars.update(tok)
    if not chars:
        return None
    if len(chars) == 1:
        unico = next(iter(chars))
        if unico in ("0", "1"):
            return ["0", "1"]
        if unico in ("a", "b"):
            return ["a", "b"]
        return [unico]
    return sorted(chars)


def resolver_enunciado(enunciado: str) -> Dict[str, object]:
    """Interpreta un enunciado de lenguaje regular y retorna alfabeto, expresion y pasos."""
    texto_base = re.sub(r"\s+", " ", unicodedata.normalize("NFC", enunciado.strip().strip("*_\"'«“‘»”’").strip()))
    if not texto_base:
        raise ValueError("Escribe el enunciado del problema, por ejemplo: «Diseñar un AFD que acepte cadenas binarias que terminen en 01».")

    simbolos_exp, texto_sin_alfa, origen_alfa = _extraer_alfabeto(texto_base)
    m_regex = re.search(r"(?:expresi[oó]n regular|regex)\s*(?:es|:|=)?\s*([a-zA-Z0-9|*().+∪]+)", texto_sin_alfa, re.IGNORECASE)
    if m_regex:
        expr = m_regex.group(1).strip()
        simbolos = simbolos_exp or sorted({c for c in expr if c not in "|*().+∪"})
        if not simbolos:
            raise ValueError("Indica los símbolos del alfabeto dentro del enunciado, por ejemplo «sobre {a, b}».")
        explicacion = f"Se extrajo directamente la expresión regular «{expr}» sobre Σ = {{{', '.join(simbolos)}}}."
        return {
            "alfabetoStr": ", ".join(simbolos),
            "expresion": expr,
            "explicacion": explicacion,
            "pasos": [
                {"titulo": "1. Identificación del alfabeto (Σ)", "detalle": explicacion, "formula": f"Σ = {{{', '.join(simbolos)}}}"},
                {"titulo": "2. Expresión regular identificada", "detalle": explicacion, "formula": f"R = {expr}"},
            ],
        }

    condicion = _limpiar_preambulo(texto_sin_alfa)
    condicion = re.sub(r"^que\s+", "", condicion, flags=re.IGNORECASE).strip()

    simbolos = simbolos_exp or _inferir_alfabeto(condicion)
    if not simbolos:
        raise ValueError("Indica los símbolos dentro del enunciado, por ejemplo «Cadenas sobre {a, b}», o escribe «Cadenas binarias».")
    if len(simbolos) > 6 or any(not re.fullmatch(r"[a-zA-Z0-9]", s) for s in simbolos):
        raise ValueError("Escribe de uno a seis símbolos de una letra o dígito, separados por comas dentro de las llaves.")

    libre = simbolos[0] if len(simbolos) == 1 else f"({'|'.join(simbolos)})"
    cualquiera = f"{libre}*"

    def validar(valor: str) -> str:
        literal = re.sub(r'^["“\'‘]|["”\'’]$', "", valor)
        if len(literal) > 12:
            raise ValueError("Usa palabras de hasta 12 símbolos en la condición.")
        for sim in literal:
            if sim not in simbolos:
                raise ValueError(f"El símbolo «{sim}» de «{literal}» debe pertenecer a Σ = {{{', '.join(simbolos)}}}.")
        return literal

    def resolver_simple(cond_raw: str) -> Optional[Tuple[str, str]]:
        cond = re.sub(r"^que\s+", "", cond_raw.strip(), flags=re.IGNORECASE)
        if not cond or re.fullmatch(r"cualquier (?:combinaci[oó]n|secuencia)", cond, re.IGNORECASE):
            return cualquiera, "Cada posición admite cualquier símbolo del alfabeto, incluyendo la cadena vacía."

        m = re.fullmatch(rf"{_INICIO} ({_PALABRA}) y {_FINAL} ({_PALABRA})", cond, re.IGNORECASE)
        if m:
            prefijo, sufijo = validar(m.group(1)), validar(m.group(2))
            alts = [prefijo + cualquiera + sufijo]
            for lon in range(1, min(len(prefijo), len(sufijo)) + 1):
                if prefijo.endswith(sufijo[:lon]):
                    alts.append(prefijo + sufijo[lon:])
            return "|".join(alts), f"Se fija «{prefijo}» al inicio y «{sufijo}» al final."

        patrones = [
            (_INICIO, lambda s: s + cualquiera, lambda s: f"Se fija «{s}» al comienzo.", False),
            (_FINAL, lambda s: cualquiera + s, lambda s: f"Se fija «{s}» al final.", False),
            (_CONTIENE, lambda s: cualquiera + s + cualquiera, lambda s: f"Se fija la subcadena «{s}».", False),
            (r"(?:cuyo )?primer s[ií]mbolo es", lambda s: s + cualquiera, lambda s: f"El primer símbolo es «{s}».", True),
            (r"(?:cuyo )?segundo s[ií]mbolo es", lambda s: libre + s + cualquiera, lambda s: f"El segundo símbolo es «{s}».", True),
            (r"(?:cuyo )?[uú]ltimo s[ií]mbolo es", lambda s: cualquiera + s, lambda s: f"El último símbolo es «{s}».", True),
            (r"(?:cuyo )?pen[uú]ltimo s[ií]mbolo es", lambda s: cualquiera + s + libre, lambda s: f"Después de «{s}» queda un símbolo libre.", True),
            (r"(?:cuyo )?antepen[uú]ltimo s[ií]mbolo es", lambda s: cualquiera + s + libre + libre, lambda s: f"Después de «{s}» quedan dos símbolos libres.", True),
        ]
        for frase, fn_expr, fn_exp, un_simbolo in patrones:
            mp = re.fullmatch(rf"{frase} ({_PALABRA})", cond, re.IGNORECASE)
            if mp:
                lit = validar(mp.group(1))
                if un_simbolo and len(lit) != 1:
                    raise ValueError("Indica un único símbolo para esa posición.")
                return fn_expr(lit), fn_exp(lit)

        for pat_neg, fn_neg in [
            (rf"no {_INICIO} ({_PALABRA})", lambda otro: (f"{otro}{cualquiera}", "No empieza con el símbolo indicado.")),
            (rf"no {_FINAL} ({_PALABRA})", lambda otro: (f"{cualquiera}{otro}", "No termina con el símbolo indicado.")),
            (rf"no {_CONTIENE} ({_PALABRA})", lambda otro: (f"{otro}*", "No contiene el símbolo indicado.")),
        ]:
            mn = re.fullmatch(pat_neg, cond, re.IGNORECASE)
            if mn:
                s = validar(mn.group(1))
                if len(s) == 1:
                    otros = [x for x in simbolos if x != s]
                    if not otros:
                        raise ValueError(f"No hay otros símbolos en Σ distintos de «{s}».")
                    otro_expr = otros[0] if len(otros) == 1 else f"({'|'.join(otros)})"
                    return fn_neg(otro_expr)

        ml = re.fullmatch(r"(?:(?:son|sean) )?(?:de )?(?:tienen |tengan )?longitud (par|impar|\d+)", cond, re.IGNORECASE)
        if ml:
            val = ml.group(1).lower()
            if val in ("par", "impar"):
                return f"{libre if val == 'impar' else ''}({libre}{libre})*", f"Longitud {val}."
            cant = int(val)
            if cant > 12:
                raise ValueError("Usa una longitud entre 0 y 12.")
            return (libre * cant) or "ε", f"Longitud exacta de {cant} símbolos."

        mle = re.fullmatch(r"(?:tienen|tengan|son|sean)?\s*(?:de\s+)?(?:exactamente\s+)?(\d+|cero|un|uno|una|dos|tres|cuatro|cinco|seis)\s+s[ií]mbolos?", cond, re.IGNORECASE)
        if mle:
            cant = _parsear_numero(mle.group(1))
            if cant is not None and cant <= 12:
                return (libre * cant) or "ε", f"Longitud exacta de {cant} símbolos."

        mlm = re.fullmatch(r"(?:(?:son|sean|tienen|tengan) )?(?:de )?longitud (?:al menos|m[ií]nima(?: de)?|mayor o igual (?:a|que)) (\d+|un|uno|una|dos|tres|cuatro|cinco|seis)(?: s[ií]mbolos?)?", cond, re.IGNORECASE)
        if mlm:
            n = _parsear_numero(mlm.group(1))
            if n is None or n > 12:
                raise ValueError("Usa una longitud mínima entre 0 y 12.")
            return f"{libre * n}{cualquiera}", f"Longitud mínima de {n} símbolos."

        mlk = re.fullmatch(r"(?:(?:son|sean|tienen|tengan) )?(?:de )?longitud (?:m[uú]ltiplo de|divisible (?:por|entre)) (\d+|dos|tres|cuatro|cinco|seis)", cond, re.IGNORECASE)
        if mlk:
            k = _parsear_numero(mlk.group(1))
            if k is None or k < 1 or k > 6:
                raise ValueError("Usa un múltiplo de longitud entre 1 y 6.")
            return f"({libre * k})*", f"Longitud múltiplo de {k}."

        mc = re.fullmatch(rf"(?:tienen|tengan|contienen|contengan|poseen|posean) (?:una cantidad|un n[uú]mero) (par|impar) de ({_PALABRA})", cond, re.IGNORECASE)
        if mc:
            sim = validar(_normalizar_simbolo_conteo(mc.group(2)))
            if len(sim) != 1:
                raise ValueError("Indica un único símbolo para contar sus apariciones.")
            otros = [x for x in simbolos if x != sim]
            relleno = f"({'|'.join(otros)})*" if len(otros) > 1 else (f"{otros[0]}*" if otros else "")
            ocurr = sim + relleno
            impar = mc.group(1).lower() == "impar"
            return f"{relleno}{ocurr if impar else ''}({ocurr}{ocurr})*", f"Cantidad {mc.group(1).lower()} de «{sim}»."

        ma = re.fullmatch(rf"(?:tienen|tengan|contienen|contengan) al menos (\d+|un|uno|una|dos|tres|cuatro|cinco|seis)(?: apariciones de| veces)? ({_PALABRA})", cond, re.IGNORECASE)
        if ma:
            n = _parsear_numero(ma.group(1))
            sim = validar(_normalizar_simbolo_conteo(ma.group(2)))
            if len(sim) != 1 or n is None or n > 6:
                raise ValueError("Indica un único símbolo y una cantidad entre 0 y 6.")
            return (cualquiera if n == 0 else f"{(cualquiera + sim) * n}{cualquiera}"), f"Al menos {n} apariciones de «{sim}»."

        me = re.fullmatch(rf"(?:tienen|tengan|contienen|contengan) exactamente (\d+|cero|un|uno|una|dos|tres|cuatro|cinco|seis)(?: apariciones de| veces)? ({_PALABRA})", cond, re.IGNORECASE)
        if me:
            n = _parsear_numero(me.group(1))
            sim = validar(_normalizar_simbolo_conteo(me.group(2)))
            if len(sim) != 1 or n is None or n > 6:
                raise ValueError("Indica un único símbolo y una cantidad entre 0 y 6.")
            otros = [x for x in simbolos if x != sim]
            relleno = f"({'|'.join(otros)})*" if len(otros) > 1 else (f"{otros[0]}*" if otros else "")
            return (relleno or "ε") if n == 0 else f"{relleno}{(sim + relleno) * n}", f"Exactamente {n} apariciones de «{sim}»."

        mk = re.fullmatch(rf"(?:tienen|tengan|contienen|contengan) (?:una cantidad|un n[uú]mero) de ({_PALABRA}) (?:m[uú]ltiplo de|divisible (?:por|entre)) (\d+|dos|tres|cuatro|cinco|seis)", cond, re.IGNORECASE)
        if mk:
            sim = validar(_normalizar_simbolo_conteo(mk.group(1)))
            k = _parsear_numero(mk.group(2))
            if len(sim) != 1 or k is None or k < 1 or k > 6:
                raise ValueError("Indica un único símbolo y un múltiplo entre 1 y 6.")
            otros = [x for x in simbolos if x != sim]
            relleno = f"({'|'.join(otros)})*" if len(otros) > 1 else (f"{otros[0]}*" if otros else "")
            return f"{relleno}({(sim + relleno) * k})*", f"Cantidad de «{sim}» múltiplo de {k}."

        return None

    res = resolver_simple(condicion)
    if res:
        expr, expl = res
    else:
        partes = re.split(r"\s+o\s+", condicion, flags=re.IGNORECASE)
        resueltas = [resolver_simple(p) for p in partes] if len(partes) >= 2 else []
        if resueltas and all(r is not None for r in resueltas):
            expr = "|".join(f"({r[0]})" for r in resueltas if r is not None)
            expl = "Se unen las condiciones con el operador |."
        else:
            raise ValueError(
                "No pude interpretar la condición completa. Prueba con inicio, final, subcadena, "
                "posición (primer/último/penúltimo símbolo), longitud (par/impar/exacta/múltiplo) o cantidad de un símbolo."
            )

    alfa_str = ", ".join(simbolos)
    return {
        "alfabetoStr": alfa_str,
        "expresion": expr,
        "explicacion": expl,
        "pasos": [
            {"titulo": "1. Identificación del alfabeto (Σ)", "detalle": f"Origen: {origen_alfa or 'inferido'}", "formula": f"Σ = {{{alfa_str}}}"},
            {"titulo": "2. Condición analizada", "detalle": f"«{condicion or 'cualquier cadena'}»"},
            {"titulo": "3. Expresión regular deducida", "detalle": expl, "formula": f"R = {expr}"},
        ],
    }


def _normalizar_simbolo_trans(entrada: str) -> str:
    return EPSILON if re.fullmatch(r"(?:epsilon|épsilon|eps|ε|lambda|λ)", entrada.strip(), re.IGNORECASE) else entrada.strip()


def interpretar_automata(enunciado: str) -> Dict[str, object]:
    """Interpreta un enunciado de autómata en español o notación δ/flecha."""
    texto = re.sub(r"[ \t]+", " ", unicodedata.normalize("NFC", enunciado.strip())).rstrip(".")
    # Unir saltos de línea que no cierran una oración ni inician una nueva cláusula conocida
    lineas = [ln.strip() for ln in texto.splitlines() if ln.strip()]
    reconstruido: List[str] = []
    inicio_clausula = re.compile(r"^(?:desde\s+|(?:δ|delta|d)\(|[a-zA-Z0-9_]+\s*--)", re.IGNORECASE)
    for ln in lineas:
        if reconstruido and not reconstruido[-1].endswith((".", ";")) and not inicio_clausula.match(ln):
            reconstruido[-1] = reconstruido[-1] + " " + ln
        else:
            reconstruido.append(ln)
    texto_unido = "\n".join(reconstruido)

    oraciones = [o.strip() for o in re.split(r"\s*[.;\n]+\s*", texto_unido) if o.strip()]
    if not oraciones:
        raise ValueError("Escribe el enunciado del autómata, por ejemplo: «Autómata con estado inicial A y estado final C. Desde A con 0 va a C.»")

    estado = r"[a-zA-Z0-9_]+"
    lista_estados = rf"{estado}(?:(?:, ?| y ){estado})*"
    lista_simbolos = r"\S+(?:(?:,\s*|\s+y\s+)\S+)*"

    enc_re = re.compile(
        rf"^(?:(?:analiza|analice|analizar|minimiza|minimice|minimizar|determina|determine|determinar|convierte|convierta|convertir) )?"
        rf"(?:(?:un |el )?aut[oó]mata(?: finito(?: (?:determinista|no determinista))?)? )?"
        rf"(?:(?:con )?(?:el )?alfabeto (?:Σ\s*=\s*)?\{{([^{{}}]+)\}} ?(?:, ?|y |con )?)?"
        rf"(?:con )?(?:estado )?inicial ({estado})(?:, | y )(?:estados? )?"
        rf"(?:(?:final(?:es)?|de aceptaci[oó]n)(?: en)? (\{{\}}|{lista_estados})|sin (?:estados )?(?:finales|de aceptaci[oó]n))$",
        re.IGNORECASE,
    )
    m_enc = enc_re.match(oraciones[0])
    if not m_enc:
        raise ValueError("Indica el estado inicial y los finales en la primera oración, como «Autómata con estado inicial A y estado final C».")

    alfabeto_decl, inicial, finales_decl = m_enc.group(1), m_enc.group(2), m_enc.group(3)
    finales = [s.strip() for s in re.split(r",\s*| y ", finales_decl, flags=re.IGNORECASE)] if finales_decl and finales_decl != "{}" else []

    estados_orden: List[str] = []
    for e in [inicial, *finales]:
        if e not in estados_orden:
            estados_orden.append(e)
    simbolos_orden: List[str] = []
    transiciones: List[Dict[str, str]] = []

    clausula_re = re.compile(rf"^desde ({estado}) con ({lista_simbolos}) (?:va|vuelve|pasa) a ({lista_estados})$", re.IGNORECASE)
    delta_re = re.compile(rf"^(?:δ|delta|d)\(({estado})\s*,\s*(\S+)\)\s*(?:=|->|=>)\s*(?:\{{([^}}]+)\}}|({lista_estados}))$", re.IGNORECASE)
    flecha_re = re.compile(rf"^({estado})\s*--\s*(\S+)\s*-->\s*({lista_estados})$", re.IGNORECASE)

    def reg_estado(e: str) -> None:
        if e not in estados_orden:
            estados_orden.append(e)

    def reg_simbolo(s: str) -> None:
        if s != EPSILON and s not in simbolos_orden:
            simbolos_orden.append(s)

    for oracion in oraciones[1:]:
        mc = clausula_re.match(oracion)
        if mc:
            origen, entradas, destinos = mc.group(1), mc.group(2), mc.group(3)
            reg_estado(origen)
            for sim in (_normalizar_simbolo_trans(x) for x in re.split(r",\s*|\s+y\s+", entradas, flags=re.IGNORECASE)):
                reg_simbolo(sim)
                for dest in (d.strip() for d in re.split(r",\s*| y ", destinos, flags=re.IGNORECASE)):
                    reg_estado(dest)
                    transiciones.append({"origen": origen, "simbolo": sim, "destino": dest})
            continue

        md = delta_re.match(oracion)
        if md:
            origen, entrada = md.group(1), md.group(2)
            dests_raw = md.group(3) or md.group(4)
            sim = _normalizar_simbolo_trans(entrada)
            reg_estado(origen)
            reg_simbolo(sim)
            for dest in (d.strip() for d in re.split(r",\s*| y ", dests_raw, flags=re.IGNORECASE)):
                reg_estado(dest)
                transiciones.append({"origen": origen, "simbolo": sim, "destino": dest})
            continue

        mf = flecha_re.match(oracion)
        if mf:
            origen, entrada, destinos = mf.group(1), mf.group(2), mf.group(3)
            sim = _normalizar_simbolo_trans(entrada)
            reg_estado(origen)
            reg_simbolo(sim)
            for dest in (d.strip() for d in re.split(r",\s*| y ", destinos, flags=re.IGNORECASE)):
                reg_estado(dest)
                transiciones.append({"origen": origen, "simbolo": sim, "destino": dest})
            continue

        raise ValueError(f"Revisa «{oracion}». Escribe cada transición como «Desde A con 0 va a B».")

    if not alfabeto_decl and not simbolos_orden:
        raise ValueError("Escribe el alfabeto en el enunciado cuando las transiciones solo usan ε o están ausentes.")

    return {
        "alfabetoStr": alfabeto_decl if alfabeto_decl else ", ".join(simbolos_orden),
        "estadosStr": ", ".join(estados_orden),
        "inicialStr": inicial,
        "finalesStr": ", ".join(finales),
        "transiciones": transiciones,
    }
