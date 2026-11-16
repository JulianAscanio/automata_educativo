# Documento técnico de AutoLearn

## Alcance y entradas

El sistema construye y minimiza autómatas desde expresiones regulares (modalidad A) o desde componentes registrados manualmente (modalidad B). La aplicación web ejecuta los algoritmos en TypeScript en el navegador. El repositorio también contiene un motor Python y una interfaz Tkinter.

El alfabeto se ingresa separado por comas o espacios, por ejemplo `a, b`. Se rechazan alfabetos vacíos, duplicados y el símbolo reservado `ε`. Para trabajar con expresiones y cadenas se deben utilizar símbolos de un carácter: el procesamiento consume caracteres y no implementa tokens de varias letras.

Las expresiones admiten unión `|`, concatenación implícita `ab` o explícita `a.b`, estrella `*` y paréntesis. La precedencia es estrella, concatenación y unión. Por ejemplo, `(a|b)*ab` representa las cadenas que terminan en `ab`. Los alias `+` y `U` representan unión cuando no son símbolos del alfabeto; `∪` también representa unión. No se utiliza la sintaxis general de expresiones regulares de JavaScript: no se admiten clases como `[a-z]` ni cuantificadores como `{2}`.

En modalidad B se ingresan Q y F como listas separadas por comas, un único estado inicial y transiciones con origen, símbolo y destino. El inicial y los finales deben pertenecer a Q; cada transición debe referirse a estados registrados y a un símbolo del alfabeto o ε. F puede estar vacío. Se admiten AFD parciales, AFND y ε-AFND.

## Estructuras de datos

`src/core/Automata.ts` representa los estados mediante `Map<string, Estado>`, los finales mediante `Set<string>` y las transiciones mediante `Map<string, Map<string, Set<string>>>`. Los conjuntos evitan destinos duplicados y permiten representar no determinismo. Cada estado almacena identificador, marcas de inicio y aceptación y, cuando corresponde, sus estados de procedencia en `subEstados`.

`Alphabet` encapsula los símbolos y sus validaciones. `PedagogicalTracer` registra etapas, mensajes, correspondencias y particiones. Los resultados de simulación incluyen aceptación, pasos y mensaje final. En Python se utilizan diccionarios y conjuntos con el mismo propósito.

Los estados mínimos se nombran `M0`, `M1`, `M2`, etc. Su correspondencia con los estados anteriores se conserva en `subEstados` (`sub_estados` en Python) y en la bitácora. La tabla permite abrir **Ver composición** y el grafo muestra la composición al situar el puntero sobre el estado. Las capturas originales del informe corresponden a la versión anterior, que incluía la composición en el identificador.

## Algoritmos implementados

1. **Análisis de expresiones:** el parser valida los símbolos y la estructura, introduce concatenaciones y convierte a notación posfija con una pila de operadores.
2. **Thompson:** una pila de fragmentos construye el ε-AFND. Unión, concatenación y estrella conectan fragmentos mediante transiciones ε.
3. **Clasificación:** las transiciones ε identifican ε-AFND; varios destinos para un mismo par estado/símbolo identifican AFND. En ausencia de ambos, se considera AFD, incluso si hay transiciones faltantes.
4. **Subconjuntos:** calcula la clausura ε inicial y explora conjuntos alcanzables mediante movimientos por símbolo y sus clausuras. Cada conjunto produce un estado con correspondencia a los originales.
5. **Accesibilidad:** una búsqueda desde el inicial identifica los estados alcanzables; los restantes se eliminan de una copia del autómata.
6. **Minimización de Moore:** primero elimina inaccesibles y completa transiciones faltantes con un estado de rechazo. Inicia con finales y no finales, divide grupos según sus destinos a otros grupos y repite hasta estabilizar. Cada bloque estable produce un estado mínimo. No se utiliza la optimización de Hopcroft.
7. **Simulación:** recorre un AFD símbolo a símbolo y acepta si termina en F tras consumir toda la cadena. Registra el recorrido. La web indica que se debe seleccionar Determinizado o AFD Mínimo cuando la etapa actual es no determinista; ambos motores rechazan llamadas directas al simulador con AFND.

Si la entrada ya es determinista, se informa su clasificación y se continúa con la minimización sin ejecutar subconjuntos. La interfaz permite consultar las etapas inicial, determinizada cuando corresponde y mínima, además de las trazas de los algoritmos.

## Arquitectura y bibliotecas

- **React y React DOM:** formularios, navegación entre etapas y actualización de resultados.
- **SVG del navegador:** dibujo del grafo, flechas y estados; `GraphViewer` calcula posiciones y permite arrastrar nodos. No construye ni minimiza autómatas.
- **Lucide React:** iconos de los controles.
- **Tailwind CSS, PostCSS y Autoprefixer:** estilos y procesamiento de CSS.
- **TypeScript y Vite:** comprobación de tipos, servidor de desarrollo y compilación estática a `dist`.
- **Tkinter:** interfaz alternativa de escritorio para el motor Python.

Los algoritmos están implementados en `src/algorithms` y `algorithms`; no se delegan a una biblioteca de autómatas. La web puede ejecutarse sin un servidor Python. `bridge.py` adapta entradas y resultados del motor Python para sus consumidores.

## Validación y entrega

Las instrucciones de instalación están en el [README](../README.md), el manual de ambas modalidades en [EJERCICIOS_MANUALES.md](EJERCICIOS_MANUALES.md) y la matriz de pruebas en [VALIDACION.md](VALIDACION.md).

Para la sustentación: construir `(a|b)*ab`, mostrar la clasificación y subconjuntos, explicar las particiones del AFD mínimo y simular `aab` y `aba`; después cargar los ejemplos manuales de AFND con ε y AFD redundante. Verificar también la poda con el ejemplo de inaccesibles. Los resultados esperados están en el manual.

La entrega debe incorporar las capturas obtenidas en una sesión real y la exposición del equipo. El uso del mismo lenguaje que en microproyectos anteriores requiere confirmación del equipo; no se puede deducir de este repositorio.
