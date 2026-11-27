"""
gui_tkinter.py
Interfaz Gráfica Nativa de Escritorio en Python Puro (Tkinter).
No requiere dependencias externas ni compiladores; corre directamente con `python3 gui_tkinter.py`.
Incluye paridad con la versión web: intérpretes de enunciados en lenguaje natural (Modalidad A y B),
selector de etapas (Inicial, Determinizado, AFD Mínimo), diagrama de transición en Canvas,
tabla de transición, bitácora educativa y simulador de cadenas.
"""

import math
import tkinter as tk
from tkinter import ttk, messagebox
from typing import Dict, List, Optional, Tuple
import bridge
from core.models import EPSILON
from algorithms.problem_parser import (
    EJEMPLOS_ENUNCIADOS,
    EJEMPLO_AUTOMATA,
    interpretar_automata,
    resolver_enunciado,
)


class AutomataCanvas(tk.Canvas):
    """Canvas interactivo para dibujar el diagrama de transición de un autómata (RF-11)."""

    def __init__(self, master, **kwargs):
        super().__init__(master, bg="#0f172a", highlightthickness=1, highlightbackground="#334155", **kwargs)
        self.automata_dict: Optional[dict] = None
        self.posiciones: Dict[str, Tuple[float, float]] = {}
        self._arrastrando: Optional[str] = None
        self.bind("<Button-1>", self._al_presionar)
        self.bind("<B1-Motion>", self._al_arrastrar)
        self.bind("<ButtonRelease-1>", self._al_soltar)
        self.bind("<Configure>", lambda _e: self._redibujar() if self.automata_dict else None)

    def cargar_automata(self, automata_dict: Optional[dict]) -> None:
        self.automata_dict = automata_dict
        self.posiciones.clear()
        self._calcular_posiciones()
        self._redibujar()

    def _calcular_posiciones(self) -> None:
        if not self.automata_dict:
            return
        estados = self.automata_dict.get("estados", [])
        n = len(estados)
        if n == 0:
            return
        w = max(self.winfo_width(), 520)
        h = max(self.winfo_height(), 300)
        cx, cy = w / 2.0, h / 2.0
        radio = max(70.0, min(w, h) * 0.34)
        for i, est in enumerate(estados):
            ang = -math.pi / 2 + (2 * math.pi * i / n)
            self.posiciones[est["id"]] = (cx + radio * math.cos(ang), cy + radio * math.sin(ang))

    def _al_presionar(self, event) -> None:
        for q_id, (x, y) in self.posiciones.items():
            if math.hypot(event.x - x, event.y - y) <= 24:
                self._arrastrando = q_id
                return

    def _al_arrastrar(self, event) -> None:
        if self._arrastrando:
            w = max(self.winfo_width(), 100)
            h = max(self.winfo_height(), 100)
            self.posiciones[self._arrastrando] = (
                max(30, min(w - 30, event.x)),
                max(30, min(h - 30, event.y)),
            )
            self._redibujar()

    def _al_soltar(self, _event) -> None:
        self._arrastrando = None

    def _redibujar(self) -> None:
        self.delete("all")
        if not self.automata_dict:
            self.create_text(260, 140, text="Esperando procesamiento...", fill="#94a3b8", font=("Helvetica", 11))
            return

        if not self.posiciones:
            self._calcular_posiciones()

        # Agrupar transiciones paralelas (origen, destino) -> [simbolos]
        grupos: Dict[Tuple[str, str], List[str]] = {}
        for t in self.automata_dict.get("transiciones", []):
            clave = (t["origen"], t["destino"])
            grupos.setdefault(clave, []).append(t["simbolo"])

        r_nodo = 22
        for (orig, dest), simbolos in grupos.items():
            if orig not in self.posiciones or dest not in self.posiciones:
                continue
            x1, y1 = self.posiciones[orig]
            x2, y2 = self.posiciones[dest]
            etiqueta = ", ".join(simbolos)

            if orig == dest:
                # Auto-bucle superior
                self.create_oval(
                    x1 - 16, y1 - r_nodo - 26, x1 + 16, y1 - r_nodo + 4,
                    outline="#38bdf8", width=1.8
                )
                self.create_text(x1, y1 - r_nodo - 34, text=etiqueta, fill="#f8fafc", font=("Courier", 9, "bold"))
                continue

            dx, dy = x2 - x1, y2 - y1
            dist = math.hypot(dx, dy) or 1.0
            ux, uy = dx / dist, dy / dist
            # Desplazar si existe arista inversa para que no se superpongan
            tiene_inversa = (dest, orig) in grupos
            offset = 16 if tiene_inversa else 0
            nx, ny = -uy * offset, ux * offset

            sx, sy = x1 + ux * r_nodo, y1 + uy * r_nodo
            ex, ey = x2 - ux * r_nodo, y2 - uy * r_nodo
            mx, my = (sx + ex) / 2 + nx, (sy + ey) / 2 + ny

            if tiene_inversa:
                self.create_line(sx, sy, mx, my, ex, ey, smooth=True, arrow=tk.LAST, fill="#38bdf8", width=1.8)
                self.create_text(mx + (-uy * 10), my + (ux * 10), text=etiqueta, fill="#f8fafc", font=("Courier", 9, "bold"))
            else:
                self.create_line(sx, sy, ex, ey, arrow=tk.LAST, fill="#38bdf8", width=1.8)
                self.create_text(mx + (-uy * 11), my + (ux * 11), text=etiqueta, fill="#f8fafc", font=("Courier", 9, "bold"))

        # Dibujar estados encima de las aristas
        for est in self.automata_dict.get("estados", []):
            q_id = est["id"]
            if q_id not in self.posiciones:
                continue
            x, y = self.posiciones[q_id]
            es_ini = est.get("esInicial", False)
            es_fin = est.get("esFinal", False)

            if es_ini:
                self.create_line(x - r_nodo - 26, y, x - r_nodo - 2, y, arrow=tk.LAST, fill="#34d399", width=2.2)

            fill_color = "#312e81" if es_ini else "#1e293b"
            outline_color = "#fbbf24" if es_fin else "#818cf8"
            self.create_oval(
                x - r_nodo, y - r_nodo, x + r_nodo, y + r_nodo,
                fill=fill_color, outline=outline_color, width=2.2
            )
            if es_fin:
                self.create_oval(
                    x - (r_nodo - 5), y - (r_nodo - 5), x + (r_nodo - 5), y + (r_nodo - 5),
                    outline=outline_color, width=1.5
                )

            texto = q_id if len(q_id) <= 8 else q_id[:7] + "…"
            self.create_text(x, y, text=texto, fill="#f8fafc", font=("Helvetica", 9, "bold"))


class AutomataGUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("AutoLearn - Software Educativo de Autómatas Finitos (Python)")
        self.root.geometry("1120x820")
        self.root.minsize(900, 650)

        self.style = ttk.Style()
        self.style.theme_use("clam")

        self.resultado_actual: Optional[dict] = None
        self.etapa_actual = tk.StringVar(value="minimo")
        self.crear_interfaz()

    def crear_interfaz(self):
        header = tk.Frame(self.root, bg="#1e1b4b", padx=16, pady=12)
        header.pack(fill="x")
        tk.Label(
            header,
            text="AutoLearn • Teoría de la Computación (100% Python)",
            fg="#e0e7ff",
            bg="#1e1b4b",
            font=("Helvetica", 14, "bold"),
        ).pack(side="left")

        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=12, pady=8)

        self.tab_a = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(self.tab_a, text="Modalidad A: Problema / Regex")
        self.crear_tab_modalidad_a()

        self.tab_b = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(self.tab_b, text="Modalidad B: Desde Autómata")
        self.crear_tab_modalidad_b()

        self.tab_resultados = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(self.tab_resultados, text="Tabla, Diagrama y Etapas")
        self.crear_tab_resultados()

        self.tab_traza = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(self.tab_traza, text="Bitácora Educativa (RF-10/13)")
        self.crear_tab_traza()

        self.tab_simulacion = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(self.tab_simulacion, text="Simulador de Cadenas (RF-12)")
        self.crear_tab_simulacion()

    def crear_tab_modalidad_a(self):
        # Sección 1: Enunciado en lenguaje natural
        prob_frame = ttk.LabelFrame(self.tab_a, text="Problema de Lenguaje (Lenguaje Natural)", padding=10)
        prob_frame.pack(fill="x", pady=4)

        ttk.Label(
            prob_frame,
            text="Describe el lenguaje (ej. «Diseñar un AFD que acepte las cadenas binarias que terminen en 01.»):",
        ).pack(anchor="w")

        self.txt_enunciado_a = tk.Text(prob_frame, height=3, font=("Helvetica", 10))
        self.txt_enunciado_a.pack(fill="x", pady=4)
        self.txt_enunciado_a.insert("1.0", EJEMPLOS_ENUNCIADOS[0][1])

        ej_frame = ttk.Frame(prob_frame)
        ej_frame.pack(fill="x", pady=4)
        ttk.Label(ej_frame, text="Ejemplos:", font=("Helvetica", 9, "bold")).pack(side="left", padx=2)
        for titulo, texto in EJEMPLOS_ENUNCIADOS:
            ttk.Button(
                ej_frame,
                text=titulo,
                command=lambda t=texto: self.cargar_enunciado_a(t, ejecutar=True),
            ).pack(side="left", padx=2)

        tk.Button(
            prob_frame,
            text="⚡ Resolver Problema de Lenguaje",
            bg="#4f46e5",
            fg="white",
            font=("Helvetica", 10, "bold"),
            padx=12,
            pady=6,
            command=self.procesar_enunciado_a,
        ).pack(anchor="e", pady=4)

        self.txt_derivacion_a = tk.Text(prob_frame, height=5, font=("Courier", 9), bg="#f8fafc")
        self.txt_derivacion_a.pack(fill="x", pady=4)

        # Sección 2: Entrada directa Alfabeto + Regex
        frame = ttk.LabelFrame(self.tab_a, text="Definición Directa (Alfabeto Σ y Expresión Regular)", padding=10)
        frame.pack(fill="x", pady=6)

        ttk.Label(frame, text="RF-01: Alfabeto Σ (separado por comas):").grid(row=0, column=0, sticky="w", pady=4)
        self.txt_alfa_a = ttk.Entry(frame, width=40)
        self.txt_alfa_a.insert(0, "a, b")
        self.txt_alfa_a.grid(row=0, column=1, sticky="w", pady=4, padx=8)

        ttk.Label(frame, text="RF-02: Expresión Regular:").grid(row=1, column=0, sticky="w", pady=4)
        self.txt_regex = ttk.Entry(frame, width=40)
        self.txt_regex.insert(0, "(a|b)*ab")
        self.txt_regex.grid(row=1, column=1, sticky="w", pady=4, padx=8)

        btn_frame = ttk.Frame(frame)
        btn_frame.grid(row=2, column=0, columnspan=2, sticky="w", pady=4)
        ttk.Button(btn_frame, text="(a|b)*ab", command=lambda: self.cargar_ejemplo_a("a, b", "(a|b)*ab")).pack(side="left", padx=3)
        ttk.Button(btn_frame, text="a(a|b)*b", command=lambda: self.cargar_ejemplo_a("a, b", "a(a|b)*b")).pack(side="left", padx=3)
        ttk.Button(btn_frame, text="(0|1)*1(0|1)", command=lambda: self.cargar_ejemplo_a("0, 1", "(0|1)*1(0|1)")).pack(side="left", padx=3)

        tk.Button(
            self.tab_a,
            text="⚡ Ejecutar desde Expresión Regular (Thompson ➔ Subconjuntos ➔ Minimización)",
            bg="#4338ca",
            fg="white",
            font=("Helvetica", 10, "bold"),
            padx=12,
            pady=7,
            command=self.procesar_modalidad_a,
        ).pack(pady=6)

    def cargar_enunciado_a(self, texto: str, ejecutar: bool = False):
        self.txt_enunciado_a.delete("1.0", tk.END)
        self.txt_enunciado_a.insert("1.0", texto)
        if ejecutar:
            self.procesar_enunciado_a()

    def cargar_ejemplo_a(self, alfa: str, regex: str):
        self.txt_alfa_a.delete(0, tk.END)
        self.txt_alfa_a.insert(0, alfa)
        self.txt_regex.delete(0, tk.END)
        self.txt_regex.insert(0, regex)

    def crear_tab_modalidad_b(self):
        # Sección 1: Enunciado en lenguaje natural
        enun_frame = ttk.LabelFrame(self.tab_b, text="Enunciado del Autómata (Lenguaje Natural o Notación δ)", padding=8)
        enun_frame.pack(fill="x", pady=4)

        self.txt_enunciado_b = tk.Text(enun_frame, height=3, font=("Helvetica", 10))
        self.txt_enunciado_b.pack(fill="x", pady=4)
        self.txt_enunciado_b.insert("1.0", EJEMPLO_AUTOMATA)

        enun_btns = ttk.Frame(enun_frame)
        enun_btns.pack(fill="x")
        ttk.Button(
            enun_btns,
            text="Ejemplo AFND con ε",
            command=lambda: self._cargar_enunciado_b(EJEMPLO_AUTOMATA, ejecutar=True),
        ).pack(side="left")
        tk.Button(
            enun_btns,
            text="⚡ Analizar y minimizar desde enunciado",
            bg="#0f766e",
            fg="white",
            font=("Helvetica", 9, "bold"),
            padx=10,
            pady=4,
            command=self.procesar_enunciado_b,
        ).pack(side="right")

        # Sección 2: Entrada manual de 5-tupla
        frame = ttk.LabelFrame(self.tab_b, text="Definición Manual de la 5-Tupla M = (Q, Σ, δ, q0, F)", padding=10)
        frame.pack(fill="x", pady=4)

        ttk.Label(frame, text="RF-01: Alfabeto Σ:").grid(row=0, column=0, sticky="w", pady=2)
        self.txt_alfa_b = ttk.Entry(frame, width=30)
        self.txt_alfa_b.insert(0, "0, 1")
        self.txt_alfa_b.grid(row=0, column=1, sticky="w", pady=2, padx=6)

        ttk.Label(frame, text="Conjunto de Estados Q:").grid(row=0, column=2, sticky="w", pady=2)
        self.txt_estados_b = ttk.Entry(frame, width=30)
        self.txt_estados_b.insert(0, "A, B, C")
        self.txt_estados_b.grid(row=0, column=3, sticky="w", pady=2, padx=6)

        ttk.Label(frame, text="Estado Inicial q0:").grid(row=1, column=0, sticky="w", pady=2)
        self.txt_inicial_b = ttk.Entry(frame, width=30)
        self.txt_inicial_b.insert(0, "A")
        self.txt_inicial_b.grid(row=1, column=1, sticky="w", pady=2, padx=6)

        ttk.Label(frame, text="Estados Finales F:").grid(row=1, column=2, sticky="w", pady=2)
        self.txt_finales_b = ttk.Entry(frame, width=30)
        self.txt_finales_b.insert(0, "C")
        self.txt_finales_b.grid(row=1, column=3, sticky="w", pady=2, padx=6)

        presets_frame = ttk.Frame(self.tab_b)
        presets_frame.pack(fill="x", pady=4)
        ttk.Label(presets_frame, text="Cargar Casos Rápidos:", font=("Helvetica", 9, "bold")).pack(side="left", padx=4)
        ttk.Button(presets_frame, text="Caso 2: AFND con ε", command=self.cargar_caso_2).pack(side="left", padx=4)
        ttk.Button(presets_frame, text="Caso 3: AFD Redundante", command=self.cargar_caso_3).pack(side="left", padx=4)

        t_frame = ttk.LabelFrame(self.tab_b, text="RF-04: Transiciones δ (Origen, Símbolo, Destino)", padding=8)
        t_frame.pack(fill="both", expand=True, pady=4)

        add_box = ttk.Frame(t_frame)
        add_box.pack(fill="x", pady=4)

        ttk.Label(add_box, text="Origen:").pack(side="left", padx=2)
        self.ent_orig = ttk.Entry(add_box, width=8)
        self.ent_orig.pack(side="left", padx=4)

        ttk.Label(add_box, text="Símbolo:").pack(side="left", padx=2)
        self.ent_simb = ttk.Entry(add_box, width=8)
        self.ent_simb.pack(side="left", padx=4)

        ttk.Button(add_box, text="ε", width=3, command=lambda: self.ent_simb.insert(0, EPSILON)).pack(side="left", padx=2)

        ttk.Label(add_box, text="Destino:").pack(side="left", padx=2)
        self.ent_dest = ttk.Entry(add_box, width=8)
        self.ent_dest.pack(side="left", padx=4)

        ttk.Button(add_box, text="Agregar Transición", command=self.agregar_transicion_lista).pack(side="left", padx=6)
        ttk.Button(add_box, text="Eliminar Seleccionada", command=self.eliminar_transicion_lista).pack(side="left", padx=4)

        self.listbox_t = tk.Listbox(t_frame, height=5, font=("Courier", 10))
        self.listbox_t.pack(fill="both", expand=True, pady=4)

        for t in [f"A, {EPSILON}, B", "A, 0, A", "B, 1, C", "C, 0, C"]:
            self.listbox_t.insert(tk.END, t)

        tk.Button(
            self.tab_b,
            text="⚡ Ejecutar Modalidad B Manual (Clasificar ➔ Determinizar ➔ Minimizar)",
            bg="#059669",
            fg="white",
            font=("Helvetica", 10, "bold"),
            padx=12,
            pady=7,
            command=self.procesar_modalidad_b,
        ).pack(pady=6)

    def _cargar_enunciado_b(self, texto: str, ejecutar: bool = False):
        self.txt_enunciado_b.delete("1.0", tk.END)
        self.txt_enunciado_b.insert("1.0", texto)
        if ejecutar:
            self.procesar_enunciado_b()

    def agregar_transicion_lista(self):
        o = self.ent_orig.get().strip()
        s = self.ent_simb.get().strip()
        d = self.ent_dest.get().strip()
        if o and s and d:
            self.listbox_t.insert(tk.END, f"{o}, {s}, {d}")
            self.ent_orig.delete(0, tk.END)
            self.ent_simb.delete(0, tk.END)
            self.ent_dest.delete(0, tk.END)

    def eliminar_transicion_lista(self):
        sel = self.listbox_t.curselection()
        if sel:
            self.listbox_t.delete(sel)

    def cargar_caso_2(self):
        self._llenar_manual_b("0, 1", "A, B, C", "A", "C", [
            {"origen": "A", "simbolo": EPSILON, "destino": "B"},
            {"origen": "A", "simbolo": "0", "destino": "A"},
            {"origen": "B", "simbolo": "1", "destino": "C"},
            {"origen": "C", "simbolo": "0", "destino": "C"},
        ])

    def cargar_caso_3(self):
        self._llenar_manual_b("a, b", "A, B, C, D, E", "A", "C, D", [
            {"origen": o, "simbolo": s, "destino": d}
            for o, s, d in [
                ("A", "a", "B"), ("A", "b", "E"), ("B", "a", "C"), ("B", "b", "D"),
                ("C", "a", "C"), ("C", "b", "D"), ("D", "a", "D"), ("D", "b", "C"),
                ("E", "a", "E"), ("E", "b", "E"),
            ]
        ])

    def _llenar_manual_b(self, alfa: str, estados: str, inicial: str, finales: str, transiciones: List[Dict[str, str]]):
        self.txt_alfa_b.delete(0, tk.END); self.txt_alfa_b.insert(0, alfa)
        self.txt_estados_b.delete(0, tk.END); self.txt_estados_b.insert(0, estados)
        self.txt_inicial_b.delete(0, tk.END); self.txt_inicial_b.insert(0, inicial)
        self.txt_finales_b.delete(0, tk.END); self.txt_finales_b.insert(0, finales)
        self.listbox_t.delete(0, tk.END)
        for t in transiciones:
            self.listbox_t.insert(tk.END, f"{t['origen']}, {t['simbolo']}, {t['destino']}")

    def crear_tab_resultados(self):
        self.lbl_tipo = tk.Label(self.tab_resultados, text="Tipo: Esperando procesamiento...", font=("Helvetica", 11, "bold"), fg="#312e81")
        self.lbl_tipo.pack(anchor="w", pady=2)

        self.txt_clasif_det = tk.Text(self.tab_resultados, height=3, font=("Courier", 9), bg="#f8fafc")
        self.txt_clasif_det.pack(fill="x", pady=4)

        # Selector de etapa (RF-13)
        etapa_frame = ttk.Frame(self.tab_resultados)
        etapa_frame.pack(fill="x", pady=4)
        ttk.Label(etapa_frame, text="Etapa visualizada (RF-13):", font=("Helvetica", 9, "bold")).pack(side="left", padx=4)
        self.rb_inicial = ttk.Radiobutton(etapa_frame, text="1. Inicial", variable=self.etapa_actual, value="inicial", command=self._actualizar_etapa_visual)
        self.rb_inicial.pack(side="left", padx=6)
        self.rb_det = ttk.Radiobutton(etapa_frame, text="2. Determinizado (AFD)", variable=self.etapa_actual, value="determinizado", command=self._actualizar_etapa_visual)
        self.rb_det.pack(side="left", padx=6)
        self.rb_min = ttk.Radiobutton(etapa_frame, text="3. AFD Mínimo", variable=self.etapa_actual, value="minimo", command=self._actualizar_etapa_visual)
        self.rb_min.pack(side="left", padx=6)

        paned = ttk.PanedWindow(self.tab_resultados, orient=tk.HORIZONTAL)
        paned.pack(fill="both", expand=True, pady=4)

        left = ttk.LabelFrame(paned, text="RF-11: Tabla de Transición", padding=6)
        self.tree_tabla = ttk.Treeview(left, show="headings", height=10)
        self.tree_tabla.pack(fill="both", expand=True)
        paned.add(left, weight=1)

        right = ttk.LabelFrame(paned, text="RF-11: Diagrama de Transición (arrastra los nodos)", padding=6)
        self.canvas_grafo = AutomataCanvas(right, width=480, height=320)
        self.canvas_grafo.pack(fill="both", expand=True)
        paned.add(right, weight=2)

    def crear_tab_traza(self):
        ttk.Label(self.tab_traza, text="RF-10 & RF-13: Bitácora de Transformación y Mapeo de Macro-Estados:", font=("Helvetica", 10, "bold")).pack(anchor="w", pady=4)
        self.txt_traza = tk.Text(self.tab_traza, font=("Courier", 10), bg="#0f172a", fg="#e2e8f0", padx=8, pady=8)
        self.txt_traza.pack(fill="both", expand=True)

    def crear_tab_simulacion(self):
        box = ttk.Frame(self.tab_simulacion, padding=8)
        box.pack(fill="x")

        ttk.Label(box, text="Cadena a Simular (w ∈ Σ*):", font=("Helvetica", 10, "bold")).pack(side="left", padx=4)
        self.ent_cadena = ttk.Entry(box, width=25, font=("Courier", 11))
        self.ent_cadena.insert(0, "aab")
        self.ent_cadena.pack(side="left", padx=6)

        ttk.Button(box, text="▶ Simular en AFD Mínimo", command=self.ejecutar_simulacion).pack(side="left", padx=6)

        self.lbl_veredicto = tk.Label(self.tab_simulacion, text="", font=("Helvetica", 11, "bold"), pady=6)
        self.lbl_veredicto.pack(anchor="w")

        ttk.Label(self.tab_simulacion, text="Recorrido Símbolo a Símbolo:").pack(anchor="w")
        self.txt_sim_pasos = tk.Text(self.tab_simulacion, font=("Courier", 10), bg="#f1f5f9", height=12)
        self.txt_sim_pasos.pack(fill="both", expand=True, pady=4)

    def procesar_enunciado_a(self):
        try:
            enunciado = self.txt_enunciado_a.get("1.0", tk.END).strip()
            sol = resolver_enunciado(enunciado)
            self.cargar_ejemplo_a(sol["alfabetoStr"], sol["expresion"])

            self.txt_derivacion_a.delete("1.0", tk.END)
            for p in sol["pasos"]:
                linea = f"{p['titulo']}: {p['detalle']}"
                if p.get("formula"):
                    linea += f"  [{p['formula']}]"
                self.txt_derivacion_a.insert(tk.END, linea + "\n")

            res = bridge.procesar_modalidad_a_py(sol["alfabetoStr"], sol["expresion"])
            self.resultado_actual = res
            self.etapa_actual.set("minimo")
            self.actualizar_vistas(res)
            self.notebook.select(self.tab_resultados)
        except Exception as e:
            messagebox.showerror("Error en Problema de Lenguaje", str(e))

    def procesar_modalidad_a(self):
        try:
            res = bridge.procesar_modalidad_a_py(self.txt_alfa_a.get(), self.txt_regex.get())
            self.resultado_actual = res
            self.etapa_actual.set("minimo")
            self.actualizar_vistas(res)
            self.notebook.select(self.tab_resultados)
        except Exception as e:
            msg = f"{type(e).__name__}: {e}" if str(e) else type(e).__name__
            messagebox.showerror("Error de Procesamiento", msg)

    def procesar_enunciado_b(self):
        try:
            enunciado = self.txt_enunciado_b.get("1.0", tk.END).strip()
            datos = interpretar_automata(enunciado)
            self._llenar_manual_b(
                datos["alfabetoStr"],
                datos["estadosStr"],
                datos["inicialStr"],
                datos["finalesStr"],
                datos["transiciones"],
            )
            res = bridge.procesar_modalidad_b_py(
                datos["alfabetoStr"],
                datos["estadosStr"],
                datos["inicialStr"],
                datos["finalesStr"],
                datos["transiciones"],
            )
            self.resultado_actual = res
            self.etapa_actual.set("minimo")
            self.actualizar_vistas(res)
            self.notebook.select(self.tab_resultados)
        except Exception as e:
            messagebox.showerror("Error en Enunciado de Autómata", str(e))

    def procesar_modalidad_b(self):
        try:
            items = list(self.listbox_t.get(0, tk.END))
            trans_list = []
            for item in items:
                parts = [p.strip() for p in item.split(",")]
                if len(parts) == 3:
                    trans_list.append({"origen": parts[0], "simbolo": parts[1], "destino": parts[2]})

            res = bridge.procesar_modalidad_b_py(
                self.txt_alfa_b.get(),
                self.txt_estados_b.get(),
                self.txt_inicial_b.get(),
                self.txt_finales_b.get(),
                trans_list,
            )
            self.resultado_actual = res
            self.etapa_actual.set("minimo")
            self.actualizar_vistas(res)
            self.notebook.select(self.tab_resultados)
        except Exception as e:
            msg = f"{type(e).__name__}: {e}" if str(e) else type(e).__name__
            messagebox.showerror("Error de Procesamiento", msg)

    def _actualizar_etapa_visual(self):
        if not self.resultado_actual:
            return
        etapa = self.etapa_actual.get()
        if etapa == "inicial":
            aut_dict = self.resultado_actual.get("automataInicial")
        elif etapa == "determinizado" and self.resultado_actual.get("automataDFA"):
            aut_dict = self.resultado_actual["automataDFA"]
        else:
            aut_dict = self.resultado_actual.get("automataMinimo")

        if not aut_dict:
            return

        tabla = aut_dict["tabla"]
        cols = ["Estado"] + tabla["columnas"]
        self.tree_tabla["columns"] = cols
        for c in cols:
            self.tree_tabla.heading(c, text=c)
            self.tree_tabla.column(c, width=95, anchor="center")

        for item in self.tree_tabla.get_children():
            self.tree_tabla.delete(item)

        for row in tabla["filas"]:
            est = row["estado"]
            marca = ("➔ " if est.get("esInicial") else "") + ("★ " if est.get("esFinal") else "")
            vals = [f"{marca}{est['id']}"] + [row["celdas"].get(c, "—") for c in tabla["columnas"]]
            self.tree_tabla.insert("", tk.END, values=vals)

        self.canvas_grafo.cargar_automata(aut_dict)

    def actualizar_vistas(self, res):
        clasif = res["clasificacion"]
        self.lbl_tipo.config(text=f"RF-05: {clasif['tipo']}")
        self.txt_clasif_det.delete("1.0", tk.END)
        self.txt_clasif_det.insert(tk.END, "\n".join(clasif["razones"]))

        tiene_dfa = res.get("automataDFA") is not None
        self.rb_det.config(state="normal" if tiene_dfa else "disabled")
        if not tiene_dfa and self.etapa_actual.get() == "determinizado":
            self.etapa_actual.set("minimo")

        self._actualizar_etapa_visual()

        self.txt_traza.delete("1.0", tk.END)
        for t_key in ["tracerThompson", "tracerSubconjuntos", "tracerMinimizacion"]:
            t = res.get(t_key)
            if t:
                self.txt_traza.insert(tk.END, f"\n=== {t['titulo']} ===\n")
                for r in t.get("registros", []):
                    cat = r.get("categoria") or r.get("tipo", "INFO")
                    msg = r.get("mensaje", "")
                    self.txt_traza.insert(tk.END, f"[{cat}] {msg}\n")

    def ejecutar_simulacion(self):
        if not self.resultado_actual:
            messagebox.showwarning("Atención", "Primero debe ejecutar la Modalidad A o B.")
            return

        min_aut = self.resultado_actual["automataMinimo"]
        cadena = self.ent_cadena.get().strip()

        sim_res = bridge.simular_cadena_py(min_aut, cadena)
        if sim_res["aceptada"]:
            self.lbl_veredicto.config(text=f"✅ {sim_res['mensajeFinal']}", fg="#059669")
        else:
            self.lbl_veredicto.config(text=f"❌ {sim_res['mensajeFinal']}", fg="#dc2626")

        self.txt_sim_pasos.delete("1.0", tk.END)
        for p in sim_res["pasos"]:
            self.txt_sim_pasos.insert(tk.END, f"Paso {p['paso']}: {p['descripcion']}\n")


if __name__ == "__main__":
    root = tk.Tk()
    app = AutomataGUI(root)
    root.mainloop()
