"""Genera la entrega Markdown y HTML autocontenido a partir de documentación y evidencias."""
from pathlib import Path
from datetime import datetime
import base64
import json
import re
import markdown

ROOT = Path(__file__).resolve().parent
intro = '''# AutoLearn
## Software educativo de autómatas finitos

**Informe técnico, manual de usuario y evidencias de validación**

| Dato | Información |
| --- | --- |
| Integrantes | [Completar] |
| Institución | [Completar] |
| Docente | [Completar] |
| Asignatura | Teoría de la Computación |
| Microproyecto | Construcción, determinización y minimización de autómatas finitos |
| Fecha de evidencias | 15 de noviembre de 2026 |

## 1. Presentación

AutoLearn permite construir autómatas desde expresiones regulares y registrar autómatas manualmente. Clasifica la entrada, determina un AFD equivalente cuando corresponde, elimina estados inaccesibles y obtiene un AFD mínimo. El usuario consulta diagramas, tablas, explicaciones y recorridos de cadenas.

Este informe se contrasta con el archivo `MICROPROYECTO1-AF.pdf`, cuyo título interno es «Microproyecto #3». Las evidencias automáticas y de navegador corresponden a una ejecución local de la aplicación compilada, sin despliegue externo.

## 2. Análisis y casos de uso

**Objetivo general:** apoyar el aprendizaje de autómatas finitos mediante transformaciones implementadas por el equipo y explicaciones consultables de los resultados intermedios.

**Usuario principal:** estudiante o docente que desea construir, transformar o comprobar un autómata. No se requiere registro de cuenta.

| Caso de uso | Entrada y acción | Resultado |
| --- | --- | --- |
| CU-01 Construir desde lenguaje | Registrar Σ y expresión; pulsar Generar | Thompson, AFD determinizado y mínimo |
| CU-02 Analizar autómata | Registrar Q, Σ, q0, F y δ; analizar | Clasificación explicada y minimización |
| CU-03 Comparar etapas | Elegir Inicial, Determinizado o AFD Mínimo | Tabla y grafo de la etapa seleccionada |
| CU-04 Explicar transformación | Abrir Paso a paso y elegir algoritmo | Operaciones, correspondencias y particiones |
| CU-05 Verificar cadena | Elegir un AFD, ingresar cadena y avanzar | Recorrido y aceptación o rechazo |
| CU-06 Corregir entrada | Registrar datos inválidos | Mensaje que identifica el error |

### Correspondencia con los requisitos

| Código | Implementación o evidencia |
| --- | --- |
| RF-01 | Alphabet / Alfabeto; pruebas de vacío, duplicados y ε reservado |
| RF-02 | Parser con validación de símbolos, operadores y paréntesis |
| RF-03 | Construcción de Thompson en ambos motores |
| RF-04 | Formulario manual y validaciones de estados y transiciones |
| RF-05 | Clasificador y razones de determinismo/no determinismo |
| RF-06 | Construcción de subconjuntos y clausuras ε |
| RF-07 | Búsqueda de accesibles y poda previa a minimizar |
| RF-09 | Refinamiento de Moore sobre AFD completo |
| RF-10 | Bitácoras de Thompson, subconjuntos y minimización |
| RF-11 | Tabla y diagrama SVG de la etapa mínima |
| RF-12 | Simulación de AFD, recorrido y veredicto |
| RF-13 | Navegación entre etapas y consulta de trazas |

El PDF omite RF-08. RF-06 dice literalmente «Convertir un AFN a AFND equivalente»; se interpreta como determinización AFND → AFD, conforme a la descripción, los objetivos y el procesamiento esperado del mismo documento.

## 3. Instalación y ejecución

La web requiere Node.js y npm. Desde la raíz del repositorio:

```bash
npm install
npm run dev
```

Abrir la dirección que indique Vite. Para producción:

```bash
npm run build
npm run preview
```

La compilación genera `dist/`. El motor Python se valida con Python 3 y los comandos del apartado de pruebas. La interfaz alternativa se inicia con `python3 gui_tkinter.py` y requiere Tkinter disponible en el sistema; no se validó su interacción en esta sesión.

La configuración de Netlify está incluida en `netlify.toml`: compilación `npm run build` y publicación de `dist`. Las evidencias de este informe corresponden a ejecución local.

'''
sections=[intro]
for title, filename in [('4. Diseño técnico y algoritmos','DOCUMENTO_TECNICO.md'),('5. Manual y ejemplos resueltos','EJERCICIOS_MANUALES.md'),('6. Matriz y método de validación','VALIDACION.md')]:
    content=(ROOT/filename).read_text()
    content=content[content.find('\n')+1:]
    content=re.sub(r'^(#{2,5}) ', lambda m:'#'+m.group(1)+' ',content,flags=re.M)
    sections.append('## '+title+'\n\n'+content)
sections.append('''## 7. Evidencias de ejecución real

Las capturas se obtuvieron con Brave/Chromium en modo sin ventana, a partir de `dist` servido localmente. La automatización pulsó controles reales y comprobó textos del documento; no se insertaron resultados simulados en la página. Las capturas de escritorio utilizan una ventana de 1600 × 1100 y la captura móvil un ancho de 390 píxeles. El script está en `evidencias/capturar_interfaz.py` y requiere Python, `websockets`, un servidor en el puerto 4173 y un navegador con depuración remota en el puerto 9223.

Las verificaciones de texto no certifican por sí solas cada detalle gráfico. La inspección de capturas detectó nombres largos y recorte del grafo en móvil; se registran en las limitaciones.
''')
outcomes=json.loads((ROOT/'evidencias/interfaz-resultados.json').read_text())
sections.append('| Caso ejecutado | Resultado esperado verificado | Estado |\n| --- | --- | --- |\n'+'\n'.join('| '+r['caso']+' | '+r['esperado']+' | '+r['resultado']+' |' for r in outcomes))
figures=[
('01-modalidad-a-minimo','Construcción desde expresión regular','Σ = {a,b}; expresión `(a|b)*ab`. Se obtuvo un AFD mínimo de tres estados y seis transiciones. La tabla permite desplazamiento horizontal para consultar nombres extensos y columnas.'),
('02-particiones-minimizacion','Explicación del algoritmo de Moore','El panel Paso a paso muestra las particiones y operaciones de minimización. Esta evidencia complementa la prueba de que el resultado contiene tres estados.'),
('03-cadena-aceptada','Simulación exitosa','Sobre el AFD mínimo, se ingresó `aab` y se avanzó hasta el final. Resultado observado: Cadena aceptada.'),
('04-cadena-rechazada','Simulación de rechazo','Se ingresó `aba` en el mismo AFD y se avanzó hasta el veredicto. Resultado observado: Cadena rechazada.'),
('05-error-alfabeto','Validación de alfabeto duplicado','Se ingresó `a, a` y se pulsó Generar. Se mostró el error por duplicados. El resultado anterior permanece visible; no corresponde a una nueva transformación de la entrada inválida.'),
('06-modalidad-b-afnd','Entrada manual de ε-AFND','Se cargó el ejemplo AFND con ε y se analizó. El mínimo completo contiene tres estados, incluido el rechazo.'),
('07-simulador-afnd-protegido','Protección del simulador','Se seleccionó la etapa Inicial del AFND y Probar cadena. El sistema solicitó seleccionar Determinizado o AFD Mínimo, sin emitir un veredicto incorrecto.'),
('08-afd-redundante','Minimización de entrada determinista','El ejemplo AFD redundante se procesó hasta un mínimo de cuatro estados. La entrada no requiere determinización.'),
('09-poda-inaccesibles','Eliminación de estados inaccesibles','Se cargó Con inaccesibles y se abrió Paso a paso. La traza identifica `q_inacc`; las pruebas del motor verifican la poda y la conservación del lenguaje.'),
('10-error-estado-final','Estado final inexistente','Se indicó `Z` como final sin registrarlo en Q. Se observó un mensaje de error que identifica Z. Los resultados previos pueden seguir visibles.'),
('11-vista-movil','Vista de pantalla estrecha','La captura de 390 píxeles permite revisar los formularios y el apilamiento de paneles. Se observa recorte del grafo por sus coordenadas fijas; esta imagen documenta una limitación y no certifica adaptación completa a móvil.')]
for i,(name,title,description) in enumerate(figures,1):
    sections.append(f'### Figura {i}. {title}\n\n{description}\n\n![Figura {i}: {title}](evidencias/{name}.png)\n')
sections.append('## 8. Registros de pruebas\n\nSe conservaron las salidas de los comandos, su fecha UTC y el código de salida. Un código cero indica finalización correcta.\n')
for filename in ['motor-web','compilacion','casos-academicos','regresiones-python']:
    sections.append(f'### {filename}\n\nRegistro original: [evidencias/{filename}.txt](evidencias/{filename}.txt).\n\n```text\n'+(ROOT/'evidencias'/f'{filename}.txt').read_text()+'\n```\n')
sections.append('''## 9. Evaluación y límites de la entrega

Los casos incluidos finalizaron correctamente: 32.340 comparaciones automáticas de aceptación entre ambos motores, pruebas específicas de validación, tres escenarios académicos y nueve comprobaciones de texto en navegador. La compilación de producción finalizó correctamente. Las capturas muestran además las particiones y la presentación en escritorio y móvil.

Durante la revisión se corrigieron las colisiones de nombres al determinizar y la normalización de espacios en Python; las pruebas conservan casos para esos fallos. También se validan los estados finales ajenos a Q y se impide simular AFND con un simulador diseñado para AFD.

Persisten límites conocidos:

- Las pruebas de cadenas son acotadas, no una demostración formal para toda entrada posible.
- Los identificadores generados pueden ser muy largos: la tabla requiere desplazamiento horizontal y las etiquetas del grafo pueden solaparse.
- En pantallas estrechas el grafo puede quedar recortado porque utiliza coordenadas fijas; la captura móvil lo evidencia.
- Después de una entrada inválida se muestra el error, pero pueden permanecer los resultados anteriores. Se deben interpretar como resultados de la última entrada válida.
- El formato operativo es por caracteres; no se implementa un analizador de tokens de varias letras.
- No se verificaron el despliegue externo, la interacción de Tkinter ni el uso del mismo lenguaje de los microproyectos anteriores.

## 10. Guion sugerido para la sustentación

1. Presentar objetivo y las dos modalidades de entrada.
2. Construir `(a|b)*ab` con Σ = {a,b}; explicar Thompson y la clausura ε.
3. Mostrar el AFD determinizado y las correspondencias con los estados originales.
4. Explicar finales/no finales y refinamiento hasta obtener tres estados mínimos.
5. Simular `aab` y `aba`, justificando aceptación y rechazo.
6. Cargar el ε-AFND manual, explicar por qué no es determinista y revisar su conversión.
7. Cargar el AFD redundante y justificar la fusión de C y D.
8. Mostrar la poda de `q_inacc` y las validaciones por duplicados y finales inexistentes.
9. Mostrar las evidencias automáticas, los resultados y las limitaciones registradas.

La exposición oral debe realizarla el equipo. Completar los datos de portada antes de presentar el documento.
''')
text='\n\n'.join(sections)
(ROOT/'ENTREGA_AUTOLEARN.md').write_text(text)
body=markdown.markdown(text, extensions=['tables','fenced_code','toc'])
def embed(m):
    path=ROOT/m.group(1)
    return 'src="data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()+'"'
body=re.sub(r'src="(evidencias/[^\"]+\.png)"',embed,body)
css='''@page{size:A4;margin:18mm 16mm}body{font:11pt/1.5 Arial,sans-serif;color:#172235;max-width:1000px;margin:32px auto;padding:0 20px}h1{font-size:32pt;color:#3530a8}h2{font-size:19pt;border-bottom:2px solid #ddd;padding-bottom:8px;margin-top:30px}h3{font-size:13pt;margin-top:24px}table{border-collapse:collapse;width:100%;margin:15px 0;font-size:9pt}td,th{border:1px solid #ccd3dd;padding:7px;text-align:left;vertical-align:top}th{background:#eef0fa}img{max-width:100%;height:auto;border:1px solid #ccd3dd}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f5f8;padding:12px;font-size:8pt}code{font-size:.9em}a{color:#3530a8}h1,h2,h3{break-after:avoid}tr{break-inside:avoid}@media print{body{margin:0;padding:0;max-width:none}h2{break-before:page}h1+h2{break-before:auto}img{max-height:230mm;object-fit:contain}a{text-decoration:none}}'''
(ROOT/'ENTREGA_AUTOLEARN.html').write_text('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>AutoLearn — Informe de entrega</title><style>'+css+'</style></head><body>'+body+'</body></html>')
print('Generados ENTREGA_AUTOLEARN.md y ENTREGA_AUTOLEARN.html')
