# Ejercicios para probar AutoLearn

Inicia con `npm run dev` y abre la dirección que indique Vite.
En cada caso selecciona **AFD Mínimo**, entra en **Probar cadena**, pulsa **Probar** y luego **Siguiente** hasta ver el veredicto. Para probar la cadena vacía deja el campo vacío, sin escribir ε.

Los nombres de estados pueden variar; compara cantidad, transiciones y aceptación.

## 1. Cadenas que terminan en ab

Modalidad **Expresión Regular**. Alfabeto: `a, b`. Expresión: `(a|b)*ab`. Pulsa **Generar**.

- AFD mínimo: **3 estados**.
- Acepta: `ab`, `aab`, `bab`, `abab`.
- Rechaza: cadena vacía, `a`, `aba`, `abb`.
- Repite con `(a|b)*.a.b`: debe aceptar exactamente las mismas cadenas.

Tabla esperada, usando nombres ilustrativos:

| Estado | a | b |
| --- | --- | --- |
| → S0 | S1 | S0 |
| S1 | S1 | S2 |
| ★ S2 | S1 | S0 |

## 2. Cualquier cantidad de letras a

Alfabeto: `a, b`. Expresión: `a*`.

- AFD mínimo completo: **2 estados**, incluido el estado de rechazo.
- Acepta: cadena vacía, `a`, `aa`, `aaaa`.
- Rechaza: `b`, `ab`, `ba`.
- El estado inicial debe ser también final.

## 3. AFND con épsilon

En **Autómata Manual**, pulsa el ejemplo **AFND con ε** y luego **Analizar y minimizar**.

Datos del ejemplo: alfabeto `0, 1`; estados `A, B, C`; inicial `A`; final `C`.

| Origen | Símbolo | Destino |
| --- | --- | --- |
| A | ε | B |
| A | 0 | A |
| B | 1 | C |
| C | 0 | C |

- Debe clasificarse como **ε-AFND**.
- AFD mínimo completo: **3 estados**, incluido rechazo.
- Acepta: `1`, `01`, `0010`, `100`.
- Rechaza: cadena vacía, `0`, `11`, `0101`.
- En **Paso a paso → Subconjuntos**, revisa que la clausura inicial contenga A y B.

## 4. Fusión de estados equivalentes

En **Autómata Manual**, pulsa **AFD redundante** y **Analizar y minimizar**.

- Entrada: **5 estados**, clasificación **AFD**.
- Salida mínima: **4 estados**.
- C y D deben quedar en un mismo estado mínimo; revisa su correspondencia en la tabla o bitácora.
- Acepta: `aa`, `ab`, `aab`, `abb`.
- Rechaza: cadena vacía, `a`, `b`, `ba`, `bbb`.
- La etapa de determinización debe omitirse porque la entrada ya es determinista.

## 5. Eliminación de inaccesibles

En **Autómata Manual**, pulsa **Con inaccesibles** y **Analizar y minimizar**.

- `q_inacc` debe desaparecer del resultado y figurar en la explicación de poda.
- AFD mínimo completo: **4 estados**; acepta únicamente `01`.
- Acepta: `01`.
- Rechaza: cadena vacía, `0`, `1`, `010`, `001`.
- Aunque el estado inaccesible desaparece, se agrega el estado de rechazo para completar transiciones; por eso el número final también es cuatro.

## 6. Validaciones de errores

Prueba cada entrada por separado:

| Modalidad | Entrada | Resultado esperado |
| --- | --- | --- |
| Expresión Regular | Alfabeto `a, a` | Error por duplicados |
| Expresión Regular | Alfabeto `a, ε` | Error por símbolo reservado |
| Expresión Regular | Alfabeto `a, b`; expresión `ac` | Error por símbolo ajeno |
| Expresión Regular | `a|`, `()`, `*a`, `a..b`, `(a` | Error de sintaxis |
| Autómata Manual | Inicial `Z` sin incluirlo en Q | Error de estado inicial |
| Autómata Manual | Q `A,B`; inicial `A`; finales `Z` | Error: el estado final Z no pertenece a Q |
| Autómata Manual | Agrega una transición hacia `Z` sin incluirlo en Q | Error de destino |
| Simulador | En el ejercicio 1 introduce `abc` | Rechazo por símbolo ajeno |

## Comprobación visual

- Alterna entre Inicial, Determinizado y AFD Mínimo: tabla y grafo deben corresponder a la etapa elegida.
- Revisa el indicador de inicio y los estados finales en tabla y grafo.
- Arrastra un nodo: las flechas deben acompañarlo.
- Consulta las trazas de Thompson, Subconjuntos y Minimización cuando estén disponibles.
- Simula sobre el **AFD mínimo** para estos ejercicios. Si seleccionas la etapa inicial de un AFND, el panel debe indicar que selecciones Determinizado o AFD Mínimo y no ofrecer un veredicto de aceptación o rechazo.
- En una pantalla estrecha, verifica que puedas acceder a formularios, botones y tabla.

Registra para cada ejercicio: resultado observado, resultado esperado y captura si difieren. Esta guía contiene resultados esperados; no certifica que los clics hayan sido ejecutados en un navegador.
