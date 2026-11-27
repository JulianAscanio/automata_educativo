import { Alphabet } from "../core/Alphabet";

export interface PasoDerivacion {
  titulo: string;
  detalle: string;
  formula?: string;
}

export interface SolucionEnunciado {
  alfabeto: Alphabet;
  expresion: string;
  explicacion: string;
  pasos: PasoDerivacion[];
}

export const ejemplosEnunciados = [
  {
    titulo: "Termina en 01",
    texto: "Diseñar un AFD que acepte las cadenas binarias que terminen en 01.",
  },
  {
    titulo: "Inicio y final",
    texto: "Construir un autómata sobre {a, b} para las cadenas que empiecen con a y terminen en b.",
  },
  {
    titulo: "Penúltimo símbolo",
    texto: "Cadenas binarias cuyo penúltimo símbolo es 1.",
  },
  {
    titulo: "Cantidad par de 1",
    texto: "Cadenas binarias que tengan una cantidad par de 1.",
  },
  {
    titulo: "Al menos dos a",
    texto: "Cadenas sobre {a, b} que contengan al menos dos a.",
  },
  {
    titulo: "Longitud múltiplo de 3",
    texto: "Cadenas sobre {a, b} de longitud múltiplo de 3.",
  },
];

const palabra = '["“\'‘]?[a-zA-Z0-9]+["”\'’]?';
const inicio = "(?:empiezan|empiecen|comienzan|comiencen|inician|inicien) (?:con|por|en)";
const final = "(?:terminan|terminen|acaban|acaben|finalizan|finalicen) (?:en|con|por)";
const contiene = "(?:contienen|contengan|incluyen|incluyan)(?: (?:la subcadena|el patr[oó]n|la secuencia))?";

const NUMERALES: Record<string, number> = {
  cero: 0,
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
};

function parsearNumero(valor: string): number {
  const limpio = valor.toLowerCase().trim();
  if (limpio in NUMERALES) return NUMERALES[limpio];
  const n = Number(limpio);
  return Number.isInteger(n) ? n : NaN;
}

function normalizarSimboloConteo(raw: string): string {
  const s = raw.replace(/^["“'‘]|["”'’]$/g, "").trim();
  const lower = s.toLowerCase();
  if (lower === "cero" || lower === "ceros" || lower === "0s" || lower === "0's") return "0";
  if (lower === "uno" || lower === "unos" || lower === "1s" || lower === "1's") return "1";
  if (/^[a-zA-Z0-9]'?s$/i.test(s) && s.length >= 2) {
    return s[0];
  }
  return s;
}

function extraerAlfabeto(texto: string): { simbolos: string[] | null; resto: string; origen: "explicito" | "binario" | null } {
  // 1. Buscar declaración explícita entre llaves { ... } en cualquier parte
  const llaveRegex = /(?:(?:sobre|con|del|en el)\s+)?(?:(?:el\s+)?alfabeto\s+)?(?:Σ\s*=\s*)?\{([^{}]+)\}/i;
  const matchLlave = texto.match(llaveRegex);
  if (matchLlave) {
    const simbolos = matchLlave[1]
      .split(/[\s,]+/)
      .map((s) => s.trim().replace(/^['"]+|['"]+$/g, ""))
      .filter((s) => s.length > 0);
    const resto = (texto.slice(0, matchLlave.index!) + " " + texto.slice(matchLlave.index! + matchLlave[0].length))
      .replace(/\s+/g, " ")
      .trim();
    return { simbolos, resto, origen: "explicito" };
  }

  // 2. Buscar "binarias" / "binarios" / "de bits" / "de ceros y unos"
  const binarioRegex = /\b(?:binarias|binarios|de bits|de ceros y unos|de 0 y 1)\b/i;
  const matchBin = texto.match(binarioRegex);
  if (matchBin) {
    const resto = (texto.slice(0, matchBin.index!) + " " + texto.slice(matchBin.index! + matchBin[0].length))
      .replace(/\s+/g, " ")
      .trim();
    return { simbolos: ["0", "1"], resto, origen: "binario" };
  }

  return { simbolos: null, resto: texto, origen: null };
}

function limpiarPreambulo(texto: string): string {
  let limpio = texto
    .trim()
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .replace(/\.$/, "");

  // Quitar prefijos tipo "Problema:", "Enunciado:", "1.", "a)"
  limpio = limpio.replace(/^(?:(?:problema|enunciado|ejercicio)\s*\d*\s*[:.-]|\d+[.)]|[a-z]\))\s*/i, "");

  // Quitar verbos de consigna al inicio
  limpio = limpio.replace(
    /^(?:(?:diseñar|diseña|diseñe|construir|construye|construya|generar|genera|genere|crear|crea|cree|hacer|haz|haga|realizar|realiza|realice|elaborar|elabora|elabore|obtener|obtén|obtenga|hallar|halla|halle|encontrar|encuentra|encuentre|definir|define|defina|modelar|modela|modele)\s+(?:un|una|el|la)?\s*(?:afd|afnd|afn|autómata(?:\s+finito(?:\s+(?:determinista|no\s+determinista))?)?|lenguaje|expresión\s+regular)\s+(?:para(?:\s+(?:aceptar|reconocer))?|que\s+(?:acepte|reconozca|genere|represente)|de|sobre)?\s*)/i,
    ""
  );

  // Quitar "el lenguaje de (todas) las cadenas..." o "(todas) las cadenas/palabras/secuencias..."
  limpio = limpio.replace(/^(?:el\s+lenguaje\s+(?:de|formado\s+por)\s+)?(?:(?:todas\s+)?las\s+)?(?:cadenas|palabras|secuencias|hileras)\s*/i, "");

  return limpio.trim();
}

function inferirAlfabetoDeCondicion(condicion: string): string[] | null {
  const literales = condicion.match(/\b[a-zA-Z0-9]+\b/g) || [];
  const chars = new Set<string>();
  const palabrasReservadas = new Set([
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
  ]);
  for (const tok of literales) {
    if (palabrasReservadas.has(tok.toLowerCase())) continue;
    if (/^[01]+$/.test(tok)) {
      chars.add("0");
      chars.add("1");
    } else if (/^[a-zA-Z]+$/.test(tok) && tok.length <= 6) {
      for (const c of tok) chars.add(c);
    }
  }
  if (chars.size === 0) return null;
  if (chars.size === 1) {
    const unico = [...chars][0];
    if (unico === "0" || unico === "1") return ["0", "1"];
    if (unico === "a" || unico === "b") return ["a", "b"];
    return [unico];
  }
  return [...chars].sort();
}

export function resolverEnunciado(enunciado: string): SolucionEnunciado {
  const textoBase = enunciado
    .trim()
    .replace(/^[*_"'«“‘]+|[*_"'»”’]+$/g, "")
    .trim()
    .normalize("NFC")
    .replace(/\s+/g, " ");
  if (!textoBase) {
    throw new Error("Escribe el enunciado del problema, por ejemplo: «Diseñar un AFD que acepte cadenas binarias que terminen en 01».");
  }

  // Caso especial: expresión regular directa en el enunciado
  const { simbolos: simbolosExp, resto: textoSinAlfa, origen: origenAlfa } = extraerAlfabeto(textoBase);
  const matchRegexDirecta = textoSinAlfa.match(
    /(?:expresi[oó]n regular|regex)\s*(?:es|:|=)?\s*([a-zA-Z0-9|*().+∪]+)/i
  );
  if (matchRegexDirecta) {
    const expr = matchRegexDirecta[1].trim();
    let simbolos = simbolosExp;
    let origen = origenAlfa;
    if (!simbolos) {
      const inferidos = [...new Set(expr.replace(/[|*().+∪]/g, "").split(""))].sort();
      simbolos = inferidos.length > 0 ? inferidos : null;
      origen = null;
    }
    if (!simbolos || simbolos.length === 0) {
      throw new Error("Indica los símbolos del alfabeto dentro del enunciado, por ejemplo «sobre {a, b}».");
    }
    const alfabeto = new Alphabet(simbolos);
    const explicacion = `Se extrajo directamente la expresión regular «${expr}» sobre Σ = {${simbolos.join(", ")}}.`;
    return {
      alfabeto,
      expresion: expr,
      explicacion,
      pasos: [
        {
          titulo: "1. Identificación del alfabeto (Σ)",
          detalle:
            origen === "explicito"
              ? "Se toma la declaración explícita entre llaves `{...}` del enunciado."
              : origen === "binario"
              ? "El enunciado especifica cadenas binarias (símbolos 0 y 1)."
              : "Se extraen los símbolos operandos presentes en la expresión regular.",
          formula: `Σ = {${simbolos.join(", ")}}`,
        },
        {
          titulo: "2. Expresión regular identificada",
          detalle: explicacion,
          formula: `R = ${expr}`,
        },
      ],
    };
  }

  let condicion = limpiarPreambulo(textoSinAlfa);
  condicion = condicion.replace(/^(?:que|cuyo|cuya|cuyos|cuyas)\s+/i, (m) =>
    /^que\s+/i.test(m) ? "" : m
  ).trim();

  let simbolos = simbolosExp;
  if (!simbolos) {
    simbolos = inferirAlfabetoDeCondicion(condicion);
  }
  if (!simbolos || simbolos.length === 0) {
    throw new Error("Indica los símbolos dentro del enunciado, por ejemplo «Cadenas sobre {a, b}», o escribe «Cadenas binarias» para usar 0 y 1.");
  }
  if (simbolos.length > 6 || simbolos.some((s) => !/^[a-zA-Z0-9]$/.test(s))) {
    throw new Error("Escribe de uno a seis símbolos de una letra o dígito, separados por comas dentro de las llaves.");
  }

  const alfabeto = new Alphabet(simbolos);
  const libre = simbolos.length === 1 ? simbolos[0] : `(${simbolos.join("|")})`;
  const cualquiera = `${libre}*`;

  function validar(valor: string): string {
    const literal = valor.replace(/^["“'‘]|["”'’]$/g, "");
    if (literal.length > 12) throw new Error("Usa palabras de hasta 12 símbolos en la condición.");
    for (const simbolo of literal) {
      if (!alfabeto.pertenece(simbolo)) {
        throw new Error(`El símbolo «${simbolo}» de «${literal}» debe pertenecer a Σ = {${simbolos!.join(", ")}}.`);
      }
    }
    return literal;
  }

  function solucion(
    expresion: string,
    explicacion: string,
    pasosCondicion?: PasoDerivacion[]
  ): SolucionEnunciado {
    const detalleAlfa =
      origenAlfa === "explicito"
        ? `Se detecta la declaración explícita del alfabeto en el enunciado y se valida que no tenga duplicados ni el símbolo reservado ε.`
        : origenAlfa === "binario"
        ? `El enunciado indica un lenguaje binario, por lo que el alfabeto estándar está formado por 0 y 1.`
        : `No se declaró {…} explícitamente, por lo que se deducen los símbolos a partir de los literales usados en la condición.`;

    const pasos: PasoDerivacion[] = [
      {
        titulo: "1. Identificación del alfabeto (Σ)",
        detalle: detalleAlfa,
        formula: `Σ = {${simbolos!.join(", ")}}   ⟹   Σ* = ${cualquiera}`,
      },
      {
        titulo: "2. Análisis de la condición del problema",
        detalle: `Condición extraída del enunciado: «${condicion || "cualquier cadena"}».`,
      },
      ...(pasosCondicion ?? [
        {
          titulo: "3. Deducción de la expresión regular",
          detalle: explicacion,
          formula: `R = ${expresion}`,
        },
      ]),
      {
        titulo: `${pasosCondicion ? pasosCondicion.length + 3 : 4}. Expresión regular final (entrada para Thompson)`,
        detalle: "Con esta expresión regular se construye el ε-AFND (Thompson), luego el AFD (Subconjuntos) y finalmente el AFD mínimo (Hopcroft/Moore).",
        formula: `R = ${expresion}`,
      },
    ];

    return { alfabeto, expresion, explicacion, pasos };
  }

  function resolverCondicionSimple(condRaw: string): { expresion: string; explicacion: string } | null {
    const cond = condRaw.trim().replace(/^que\s+/i, "");

    if (!cond || /^cualquier (?:combinaci[oó]n|secuencia)$/i.test(cond)) {
      return {
        expresion: cualquiera,
        explicacion: "Cada posición admite cualquier símbolo del alfabeto. También se admite la cadena vacía.",
      };
    }

    // Inicio y final juntos
    const extremos = cond.match(new RegExp(`^${inicio} (${palabra}) y ${final} (${palabra})$`, "i"));
    if (extremos) {
      const prefijo = validar(extremos[1]);
      const sufijo = validar(extremos[2]);
      const alternativas = [prefijo + cualquiera + sufijo];
      for (let longitud = 1; longitud <= Math.min(prefijo.length, sufijo.length); longitud++) {
        if (prefijo.endsWith(sufijo.slice(0, longitud))) {
          alternativas.push(prefijo + sufijo.slice(longitud));
        }
      }
      const solapamientos = alternativas.slice(1);
      const detalle = solapamientos.length
        ? ` También se incluyen los casos donde ambos extremos se solapan (${solapamientos.join(", ")}).`
        : "";
      return {
        expresion: alternativas.join("|"),
        explicacion: `Se fija «${prefijo}» al inicio y «${sufijo}» al final, con cualquier secuencia entre ambos.${detalle}`,
      };
    }

    // Patrones simples: inicio, final, contiene, penúltimo, antepenúltimo, último, primer, segundo
    const patrones = [
      {
        frase: inicio,
        expresion: (s: string) => s + cualquiera,
        explicar: (s: string) => `Se fija «${s}» al comienzo y luego puede venir cualquier secuencia.`,
      },
      {
        frase: final,
        expresion: (s: string) => cualquiera + s,
        explicar: (s: string) => `Antes de «${s}» puede venir cualquier secuencia. Se fija «${s}» al final.`,
      },
      {
        frase: contiene,
        expresion: (s: string) => cualquiera + s + cualquiera,
        explicar: (s: string) => `Se fija la subcadena «${s}». Antes y después puede venir cualquier secuencia.`,
      },
      {
        frase: "(?:cuyo )?primer s[ií]mbolo es",
        expresion: (s: string) => s + cualquiera,
        explicar: (s: string) => `El primer símbolo debe ser «${s}» y después puede venir cualquier secuencia.`,
        unSimbolo: true,
      },
      {
        frase: "(?:cuyo )?segundo s[ií]mbolo es",
        expresion: (s: string) => libre + s + cualquiera,
        explicar: (s: string) => `El primer símbolo es libre, el segundo es «${s}» y luego puede venir cualquier secuencia.`,
        unSimbolo: true,
      },
      {
        frase: "(?:cuyo )?[uú]ltimo s[ií]mbolo es",
        expresion: (s: string) => cualquiera + s,
        explicar: (s: string) => `El último símbolo debe ser «${s}». Antes puede venir cualquier secuencia.`,
        unSimbolo: true,
      },
      {
        frase: "(?:cuyo )?pen[uú]ltimo s[ií]mbolo es",
        expresion: (s: string) => cualquiera + s + libre,
        explicar: (s: string) => `Después de «${s}» queda exactamente un símbolo libre. Antes puede venir cualquier secuencia.`,
        unSimbolo: true,
      },
      {
        frase: "(?:cuyo )?antepen[uú]ltimo s[ií]mbolo es",
        expresion: (s: string) => cualquiera + s + libre + libre,
        explicar: (s: string) => `Después de «${s}» quedan exactamente dos símbolos libres. Antes puede venir cualquier secuencia.`,
        unSimbolo: true,
      },
    ];

    for (const { frase, expresion, explicar, unSimbolo } of patrones) {
      const coincidencia = cond.match(new RegExp(`^${frase} (${palabra})$`, "i"));
      if (coincidencia) {
        const literal = validar(coincidencia[1]);
        if (unSimbolo && literal.length !== 1) {
          throw new Error("Indica un único símbolo para esa posición.");
        }
        return { expresion: expresion(literal), explicacion: explicar(literal) };
      }
    }

    // Negaciones simples de un símbolo (no empieza / no termina / no contiene)
    const negInicio = cond.match(new RegExp(`^no ${inicio} (${palabra})$`, "i"));
    if (negInicio) {
      const s = validar(negInicio[1]);
      if (s.length === 1) {
        const otros = simbolos!.filter((x) => x !== s);
        if (otros.length === 0) throw new Error(`No hay otros símbolos en Σ distintos de «${s}» para negar el inicio.`);
        const otroExpr = otros.length === 1 ? otros[0] : `(${otros.join("|")})`;
        return {
          expresion: `${otroExpr}${cualquiera}`,
          explicacion: `Para no empezar con «${s}» (en cadenas no vacías), el primer símbolo debe ser de {${otros.join(", ")}}.`,
        };
      }
    }

    const negFinal = cond.match(new RegExp(`^no ${final} (${palabra})$`, "i"));
    if (negFinal) {
      const s = validar(negFinal[1]);
      if (s.length === 1) {
        const otros = simbolos!.filter((x) => x !== s);
        if (otros.length === 0) throw new Error(`No hay otros símbolos en Σ distintos de «${s}» para negar el final.`);
        const otroExpr = otros.length === 1 ? otros[0] : `(${otros.join("|")})`;
        return {
          expresion: `${cualquiera}${otroExpr}`,
          explicacion: `Para no terminar en «${s}» (en cadenas no vacías), el último símbolo debe pertenecer a {${otros.join(", ")}}.`,
        };
      }
    }

    const negContiene = cond.match(new RegExp(`^no ${contiene} (${palabra})$`, "i"));
    if (negContiene) {
      const s = validar(negContiene[1]);
      if (s.length === 1) {
        const otros = simbolos!.filter((x) => x !== s);
        if (otros.length === 0) throw new Error(`No hay otros símbolos en Σ distintos de «${s}».`);
        const otroExpr = otros.length === 1 ? otros[0] : `(${otros.join("|")})`;
        return {
          expresion: `${otroExpr}*`,
          explicacion: `No contiene «${s}», por lo tanto solo pueden aparecer símbolos de {${otros.join(", ")}}.`,
        };
      }
    }

    // Longitud: par, impar, exacta, al menos N, múltiplo de K
    const longitud = cond.match(
      /^(?:(?:son|sean) )?(?:de )?(?:tienen |tengan )?longitud (par|impar|\d+)$/i
    );
    if (longitud) {
      const valor = longitud[1].toLowerCase();
      if (valor === "par" || valor === "impar") {
        return {
          expresion: `${valor === "impar" ? libre : ""}(${libre}${libre})*`,
          explicacion:
            valor === "par"
              ? "Los símbolos se agrupan en pares, incluyendo la cadena vacía."
              : "Se toma un símbolo inicial y luego se agregan pares de símbolos.",
        };
      }
      const cantidad = Number(valor);
      if (cantidad > 12) throw new Error("Usa una longitud entre 0 y 12.");
      return {
        expresion: libre.repeat(cantidad) || "ε",
        explicacion: `Se eligen exactamente ${cantidad} símbolos del alfabeto.`,
      };
    }

    const longExacta = cond.match(
      /^(?:tienen|tengan|son|sean)?\s*(?:de\s+)?(?:exactamente\s+)?(\d+|cero|un|uno|una|dos|tres|cuatro|cinco|seis)\s+s[ií]mbolos?$/i
    );
    if (longExacta) {
      const cantidad = parsearNumero(longExacta[1]);
      if (!Number.isNaN(cantidad) && cantidad <= 12) {
        return {
          expresion: libre.repeat(cantidad) || "ε",
          explicacion: `Se eligen exactamente ${cantidad} símbolos del alfabeto.`,
        };
      }
    }

    const longMin = cond.match(
      /^(?:(?:son|sean|tienen|tengan) )?(?:de )?longitud (?:al menos|m[ií]nima(?: de)?|mayor o igual (?:a|que)) (\d+|un|uno|una|dos|tres|cuatro|cinco|seis)(?: s[ií]mbolos?)?$/i
    );
    if (longMin) {
      const n = parsearNumero(longMin[1]);
      if (Number.isNaN(n) || n > 12) throw new Error("Usa una longitud mínima entre 0 y 12.");
      return {
        expresion: `${libre.repeat(n)}${cualquiera}`,
        explicacion: `Se exigen ${n} símbolos iniciales seguidos de cualquier secuencia.`,
      };
    }

    const longMult = cond.match(
      /^(?:(?:son|sean|tienen|tengan) )?(?:de )?longitud (?:m[uú]ltiplo de|divisible (?:por|entre)) (\d+|dos|tres|cuatro|cinco|seis)$/i
    );
    if (longMult) {
      const k = parsearNumero(longMult[1]);
      if (Number.isNaN(k) || k < 1 || k > 6) throw new Error("Usa un múltiplo de longitud entre 1 y 6.");
      return {
        expresion: `(${libre.repeat(k)})*`,
        explicacion: `Los símbolos se agrupan en bloques de tamaño ${k}, incluyendo la cadena vacía.`,
      };
    }

    // Conteo par/impar de un símbolo
    const conteo = cond.match(
      new RegExp(`^(?:tienen|tengan|contienen|contengan|poseen|posean) (?:una cantidad|un n[uú]mero) (par|impar) de (${palabra})$`, "i")
    );
    if (conteo) {
      const simbolo = validar(normalizarSimboloConteo(conteo[2]));
      if (simbolo.length !== 1) throw new Error("Indica un único símbolo para contar sus apariciones.");
      const otros = simbolos!.filter((s) => s !== simbolo);
      const relleno = otros.length > 1 ? `(${otros.join("|")})*` : otros.length === 1 ? `${otros[0]}*` : "";
      const ocurrencia = simbolo + relleno;
      const impar = conteo[1].toLowerCase() === "impar";
      return {
        expresion: `${relleno}${impar ? ocurrencia : ""}(${ocurrencia}${ocurrencia})*`,
        explicacion: `Se agregan apariciones de «${simbolo}» de dos en dos${
          impar ? ", con una aparición inicial" : ", incluyendo cero apariciones"
        }. Los demás símbolos pueden aparecer en cualquier posición.`,
      };
    }

    // Conteo: al menos N / exactamente N / múltiplo de K
    const conteoAlMenos = cond.match(
      new RegExp(`^(?:tienen|tengan|contienen|contengan) al menos (\\d+|un|uno|una|dos|tres|cuatro|cinco|seis)(?: apariciones de| veces)? (${palabra})$`, "i")
    );
    if (conteoAlMenos) {
      const n = parsearNumero(conteoAlMenos[1]);
      const simbolo = validar(normalizarSimboloConteo(conteoAlMenos[2]));
      if (simbolo.length !== 1) throw new Error("Indica un único símbolo para contar sus apariciones.");
      if (Number.isNaN(n) || n < 0 || n > 6) throw new Error("Usa una cantidad entre 0 y 6.");
      const bloque = `${cualquiera}${simbolo}`;
      return {
        expresion: n === 0 ? cualquiera : `${bloque.repeat(n)}${cualquiera}`,
        explicacion: `Se garantizan al menos ${n} apariciones de «${simbolo}» separadas por cualquier secuencia.`,
      };
    }

    const conteoExacto = cond.match(
      new RegExp(`^(?:tienen|tengan|contienen|contengan) exactamente (\\d+|cero|un|uno|una|dos|tres|cuatro|cinco|seis)(?: apariciones de| veces)? (${palabra})$`, "i")
    );
    if (conteoExacto) {
      const n = parsearNumero(conteoExacto[1]);
      const simbolo = validar(normalizarSimboloConteo(conteoExacto[2]));
      if (simbolo.length !== 1) throw new Error("Indica un único símbolo para contar sus apariciones.");
      if (Number.isNaN(n) || n < 0 || n > 6) throw new Error("Usa una cantidad entre 0 y 6.");
      const otros = simbolos!.filter((s) => s !== simbolo);
      const relleno = otros.length > 1 ? `(${otros.join("|")})*` : otros.length === 1 ? `${otros[0]}*` : "";
      if (n === 0) {
        return {
          expresion: relleno || "ε",
          explicacion: `No aparece «${simbolo}»; solo se permiten los demás símbolos del alfabeto.`,
        };
      }
      return {
        expresion: `${relleno}${(simbolo + relleno).repeat(n)}`,
        explicacion: `Aparece exactamente ${n} ${n === 1 ? "vez" : "veces"} el símbolo «${simbolo}», rodeado de los demás símbolos.`,
      };
    }

    const conteoMult = cond.match(
      new RegExp(`^(?:tienen|tengan|contienen|contengan) (?:una cantidad|un n[uú]mero) de (${palabra}) (?:m[uú]ltiplo de|divisible (?:por|entre)) (\\d+|dos|tres|cuatro|cinco|seis)$`, "i")
    );
    if (conteoMult) {
      const simbolo = validar(normalizarSimboloConteo(conteoMult[1]));
      const k = parsearNumero(conteoMult[2]);
      if (simbolo.length !== 1) throw new Error("Indica un único símbolo para contar sus apariciones.");
      if (Number.isNaN(k) || k < 1 || k > 6) throw new Error("Usa un múltiplo entre 1 y 6.");
      const otros = simbolos!.filter((s) => s !== simbolo);
      const relleno = otros.length > 1 ? `(${otros.join("|")})*` : otros.length === 1 ? `${otros[0]}*` : "";
      return {
        expresion: `${relleno}(${(simbolo + relleno).repeat(k)})*`,
        explicacion: `Las apariciones de «${simbolo}» se agrupan de ${k} en ${k}, permitiendo otros símbolos entre medio.`,
      };
    }

    return null;
  }

  // 1. Intentar condición simple completa
  const simple = resolverCondicionSimple(condicion);
  if (simple) {
    return solucion(simple.expresion, simple.explicacion);
  }

  // 2. Intentar unión con " o " (ej: "empiezan con a o terminan en b")
  const partesUnion = condicion.split(/\s+o\s+/i);
  if (partesUnion.length >= 2) {
    const resueltas = partesUnion.map((p) => resolverCondicionSimple(p));
    if (resueltas.every((r) => r !== null)) {
      const exprs = resueltas.map((r) => `(${r!.expresion})`);
      const pasosUnion: PasoDerivacion[] = resueltas.map((r, idx) => ({
        titulo: `3.${idx + 1}. Subcondición ${idx + 1}: «${partesUnion[idx].trim()}»`,
        detalle: r!.explicacion,
        formula: `R${idx + 1} = ${r!.expresion}`,
      }));
      pasosUnion.push({
        titulo: "4. Unión de subcondiciones (operador |)",
        detalle: "Como las condiciones están unidas por «o», se combinan mediante unión regular: R = R1 | R2.",
        formula: `R = ${exprs.join("|")}`,
      });
      return solucion(
        exprs.join("|"),
        `Se unen las condiciones con el operador |: ${resueltas.map((r) => r!.explicacion).join(" ")}`,
        pasosUnion
      );
    }
  }

  throw new Error(
    "No pude interpretar la condición completa. Prueba con inicio, final, subcadena, posición (primer/último/penúltimo símbolo), longitud (par/impar/exacta/múltiplo) o cantidad de un símbolo."
  );
}
