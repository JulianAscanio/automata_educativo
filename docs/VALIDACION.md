# Validación frente a MICROPROYECTO1-AF.pdf

Revisión inicial realizada el 14 de noviembre de 2026 y correcciones ampliadas el 15 de noviembre. El PDF se titula internamente «Microproyecto #3».

## Ejecución reproducible

```bash
npm test
npm run build
python3 test_runner.py
python3 -m unittest discover -s tests -v
```

Todos estos comandos finalizaron correctamente en esta revisión.

## Matriz de pruebas

| Requisito | Caso y evidencia automatizada | Resultado |
| --- | --- | --- |
| RF-01 | Alfabeto vacío, duplicados y ε reservado (`npm test`) | Rechazados |
| RF-02 | Concatenación `ab` y `a.b`; símbolos ajenos y expresiones mal formadas | Validación correcta en ambos motores |
| RF-03, RF-06 | Thompson y subconjuntos para catorce expresiones, incluyendo estrella y unión | Lenguaje conservado |
| RF-04, RF-05 | Casos Python: ε-AFND manual y AFD redundante | Clasificación esperada |
| RF-04 | Estados finales ajenos a Q, en validación TypeScript y entrada Python | Rechazados con mensaje que identifica el estado |
| RF-12 | Simulación directa de AFND con bifurcaciones y ε en ambos motores | Se solicita utilizar un AFD |
| RF-07 | Estado final inaccesible en autómata de lenguaje vacío | Eliminado sin alterar la entrada |
| RF-09 | `(a|b)*ab` | Tres estados mínimos |
| RF-09 | AFD parcial sin estados finales alcanzables | Un único estado mínimo completo |
| RF-09 | Entrada no determinista enviada directamente al minimizador | Error que solicita determinizar |
| RF-12 | 3.570 cadenas de longitud 0 a 7 comparadas con expresiones regulares nativas de JavaScript | Todas coinciden |
| RF-12 | Casos Python: `aab`, `aba`, `0010`, `11` | Aceptación/rechazo esperado |
| Compilación | TypeScript y build de producción Vite | Correctos |

Se prueban 14 expresiones en cada motor con las 255 cadenas sobre {a,b} de longitud hasta siete (3.570 comparaciones por motor): `(a|b)*ab`, `(a|b)*.a.b`, `a*`, `a|b`, `(ab)*`, `a`, `ab`, `a|ab`, `(a|b)*`, `(a*)*`, `a*b*`, `(a|bb)*`, `a(b|a)*b` y `((a|b)(a|b))*`.

### Pruebas ampliadas del 15 de noviembre

- Cada motor genera 100 AFND con semilla 20261115, cinco estados, transiciones ε, ciclos y transiciones faltantes. Los conjuntos generados en JavaScript y Python son diferentes porque sus generadores son diferentes.
- Un evaluador independiente explora configuraciones `(estado, posición)` del AFND original, sin usar los algoritmos de clausura ni subconjuntos del producto. Se comparan sus resultados con el AFD determinizado y con el mínimo para las 63 cadenas de longitud hasta cinco: 12.600 comparaciones por motor.
- Se comprueba que cada estado mínimo tenga exactamente un destino por símbolo, que minimizar de nuevo conserve la cantidad de estados y que el autómata original no sea alterado.
- Se prueban nombres potencialmente ambiguos (`A_B` frente a los estados `A` y `B`, y `A,B` como identificador directo del motor), entradas manuales inválidas, finales vacíos, cadena vacía, bloqueos y símbolos fuera del alfabeto.
- Se comprueban los alias de unión `+`, `U` y `∪`, además de expresiones con espacios, tabulaciones y saltos de línea.
- La suite Python contiene 12 métodos de prueba con múltiples casos internos; los tres escenarios académicos también se ejecutan por separado.

Estas comprobaciones suman 32.340 comparaciones de aceptación entre ambos motores, además de las validaciones y regresiones específicas. Todas finalizaron correctamente tras las correcciones.

## Correcciones aplicadas

- Se admite el punto de concatenación explícita documentado en ambos parsers.
- Se rechazan paréntesis vacíos, operadores sin operandos y expresiones incompletas antes de construir fragmentos.
- Ambos minimizadores completan una copia del AFD parcial con un estado de rechazo antes del refinamiento de Moore. Esto permite fusionar estados de lenguaje derecho vacío con el rechazo implícito. La bitácora explica la operación.
- Ambos minimizadores rechazan entradas con ε o múltiples destinos por símbolo.
- Se evitan colisiones en los nombres de macro-estados mediante sufijos únicos; TypeScript también utiliza claves de conjuntos serializadas sin ambigüedad. Se reprodujo el fallo con `{A_B}` y `{A,B}` antes de corregirlo.
- Python normaliza tabulaciones y saltos de línea en expresiones como el motor web.
- Se añade `npm test` para probar directamente el motor TypeScript utilizado por la web, sin dependencias nuevas.

Un AFD parcial puede tener menos estados visibles antes de minimizar que el AFD completo resultante: se incorpora el rechazo explícito necesario para completar la función de transición.

## Límites y verificaciones pendientes

La revisión ampliada incluye ejecución real en Brave/Chromium sin ventana: nueve verificaciones de texto y once capturas en `docs/evidencias`, incluidas bitácoras, simulación, tablas, grafos y errores. Las comprobaciones no cubren exhaustivamente cada interacción ni la GUI Tkinter. Se observó recorte del grafo en móvil y solapamiento de identificadores largos. No se verificó un despliegue en Netlify. Las pruebas acotadas de cadenas aportan evidencia de los casos incluidos, no una prueba formal de equivalencia para cualquier entrada.

El documento técnico está en [DOCUMENTO_TECNICO.md](DOCUMENTO_TECNICO.md) y el manual de ambas modalidades en [EJERCICIOS_MANUALES.md](EJERCICIOS_MANUALES.md). Las capturas reales y los registros están integrados en [ENTREGA_AUTOLEARN.md](ENTREGA_AUTOLEARN.md). Queda pendiente realizar la sustentación del equipo. El algoritmo de minimización implementado es refinamiento iterativo de Moore; no utiliza la optimización de Hopcroft.
