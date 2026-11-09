# AutoLearn - Software Educativo de Autómatas Finitos

Software interactivo para la enseñanza formal de Teoría de la Computación, autómatas finitos (AFD, AFND, ε-AFND) y expresiones regulares, diseñado para ser desplegado de forma estática en **Netlify**.

---

## 🚀 Despliegue en Netlify

El proyecto cuenta con configuración lista para producción mediante `netlify.toml`:

### Opción 1: Conexión mediante Git (Recomendada)
1. Sube este repositorio a GitHub, GitLab o Bitbucket.
2. En Netlify, crea un nuevo sitio desde tu proveedor Git:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Netlify compilará automáticamente con CDN global en cada push.

### Opción 2: Despliegue Manual (Drop / CLI)
1. Ejecuta en tu máquina local:
   ```bash
   npm run build
   ```
2. Arrastra la carpeta `dist/` a la sección de **Deploys** en el panel de Netlify, o con el CLI:
   ```bash
   npx netlify-cli deploy --prod --dir=dist
   ```

---

## 🛠️ Ejecución Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Compilar para producción
npm run build
```

---

## 🧠 Algoritmos Implementados

1. **RF-01 (Alfabeto):** Validación de unicidad de símbolos, proscripción del metasímbolo `ε`.
2. **RF-02 (Expresiones Regulares):** Parser Shunting-Yard con concatenación explícita `.` y precedencia `*` > `.` > `|`.
3. **Modalidad A (Thompson):** Conversión de Regex a ε-AFND formal.
4. **RF-05 (Clasificador):** Detección y explicación pedagógica de AFD, AFND y ε-AFND.
5. **RF-06 (Determinización):** Algoritmo de Construcción de Subconjuntos (Subset Construction) con cálculo de clausura épsilon (`ε-closure`) y trazabilidad de macro-estados.
6. **RF-07 (Inaccesibilidad):** Poda de estados inalcanzables mediante búsqueda en anchura (BFS).
7. **RF-09 (Minimización):** Particionamiento refinado de estados equivalentes (Hopcroft / Moore) mostrando particiones $P_0, P_1, \dots, P_k$.
8. **RF-11 (Visualización):**
   - Tabla formal de transición con indicación de estados iniciales (`➔`) y finales (`★`).
   - Grafo interactivo en SVG con auto-posicionamiento y arrastre de nodos.
9. **RF-12 (Simulador Interactivo):** Simulación paso a paso del consumo de cinta con resaltado en vivo de estados y veredicto formal de aceptación o rechazo.
10. **RF-10 & RF-13 (Bitácora Educativa):** Trazabilidad completa paso a paso de cada transformación.
