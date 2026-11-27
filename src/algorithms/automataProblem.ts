import { EPSILON, Transicion } from "../core/types";

export interface DatosAutomata {
  alfabetoStr: string;
  estadosStr: string;
  inicialStr: string;
  finalesStr: string;
  transiciones: Transicion[];
}

export const ejemploAutomata =
  "Analiza un autómata con estado inicial A y estado final C. Desde A con epsilon va a B. Desde A con 0 vuelve a A. Desde B con 1 va a C. Desde C con 0 vuelve a C.";

const estado = "[a-zA-Z0-9_]+";
const listaEstados = `${estado}(?:(?:, ?| y )${estado})*`;
const listaSimbolos = `\\S+(?:(?:,\\s*|\\s+y\\s+)\\S+)*`;
const clausula = new RegExp(`^desde (${estado}) con (${listaSimbolos}) (?:va|vuelve|pasa) a (${listaEstados})$`, "i");
const notacionDelta = new RegExp(`^(?:δ|delta|d)\\((${estado})\\s*,\\s*(\\S+)\\)\\s*(?:=|->|=>)\\s*(?:\\{([^}]+)\\}|(${listaEstados}))$`, "i");
const notacionFlecha = new RegExp(`^(${estado})\\s*--\\s*(\\S+)\\s*-->\\s*(${listaEstados})$`, "i");

function normalizarSimbolo(entrada: string): string {
  return /^(?:epsilon|épsilon|eps|ε|lambda|λ)$/i.test(entrada.trim()) ? EPSILON : entrada.trim();
}

export function interpretarAutomata(enunciado: string): DatosAutomata {
  const texto = enunciado.trim().normalize("NFC").replace(/[ \t]+/g, " ").replace(/\.$/, "");
  const oraciones = texto
    .split(/\s*[.;\n]+\s*/)
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  if (oraciones.length === 0) {
    throw new Error("Escribe el enunciado del autómata, por ejemplo: «Autómata con estado inicial A y estado final C. Desde A con 0 va a C.»");
  }

  const encabezado = oraciones[0].match(new RegExp(
    `^(?:(?:analiza|analice|analizar|minimiza|minimice|minimizar|determina|determine|determinar|convierte|convierta|convertir) )?(?:(?:un |el )?aut[oó]mata(?: finito(?: (?:determinista|no determinista))?)? )?(?:(?:con )?(?:el )?alfabeto (?:Σ\\s*=\\s*)?\\{([^{}]+)\\} ?(?:, ?|y |con )?)?(?:con )?(?:estado )?inicial (${estado})(?:, | y )(?:estados? )?(?:(?:final(?:es)?|de aceptaci[oó]n)(?: en)? (\\{\\}|${listaEstados})|sin (?:estados )?(?:finales|de aceptaci[oó]n))$`,
    "i"
  ));
  if (!encabezado) {
    throw new Error("Indica el estado inicial y los finales en la primera oración, como «Autómata con estado inicial A y estado final C».");
  }

  const [, alfabetoDeclarado, inicial, finalesDeclarados] = encabezado;
  const finales = finalesDeclarados && finalesDeclarados !== "{}" ? finalesDeclarados.split(/,\s*| y /i).map((s) => s.trim()) : [];
  const estados = new Set([inicial, ...finales]);
  const simbolos = new Set<string>();
  const transiciones: Transicion[] = [];

  for (const oracion of oraciones.slice(1)) {
    const matchClausula = oracion.match(clausula);
    if (matchClausula) {
      const [, origen, entradas, destinos] = matchClausula;
      estados.add(origen);
      const simbolosEntrada = entradas.split(/,\s*|\s+y\s+/i).map(normalizarSimbolo);
      const destinosLista = destinos.split(/,\s*| y /i).map((d) => d.trim());
      for (const simbolo of simbolosEntrada) {
        if (simbolo !== EPSILON) simbolos.add(simbolo);
        for (const destino of destinosLista) {
          estados.add(destino);
          transiciones.push({ origen, simbolo, destino });
        }
      }
      continue;
    }

    const matchDelta = oracion.match(notacionDelta);
    if (matchDelta) {
      const [, origen, entrada, destinosLlave, destinosListaRaw] = matchDelta;
      const simbolo = normalizarSimbolo(entrada);
      if (simbolo !== EPSILON) simbolos.add(simbolo);
      estados.add(origen);
      const destinosLista = (destinosLlave || destinosListaRaw).split(/,\s*| y /i).map((d) => d.trim());
      for (const destino of destinosLista) {
        estados.add(destino);
        transiciones.push({ origen, simbolo, destino });
      }
      continue;
    }

    const matchFlecha = oracion.match(notacionFlecha);
    if (matchFlecha) {
      const [, origen, entrada, destinos] = matchFlecha;
      const simbolo = normalizarSimbolo(entrada);
      if (simbolo !== EPSILON) simbolos.add(simbolo);
      estados.add(origen);
      for (const destino of destinos.split(/,\s*| y /i).map((d) => d.trim())) {
        estados.add(destino);
        transiciones.push({ origen, simbolo, destino });
      }
      continue;
    }

    throw new Error(`Revisa «${oracion}». Escribe cada transición como «Desde A con 0 va a B».`);
  }

  if (!alfabetoDeclarado && simbolos.size === 0) {
    throw new Error("Escribe el alfabeto en el enunciado cuando las transiciones solo usan ε o están ausentes.");
  }

  return {
    alfabetoStr: alfabetoDeclarado ?? [...simbolos].join(", "),
    estadosStr: [...estados].join(", "),
    inicialStr: inicial,
    finalesStr: finales.join(", "),
    transiciones,
  };
}
