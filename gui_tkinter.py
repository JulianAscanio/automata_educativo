"""
gui_tkinter.py
Interfaz Gráfica Nativa de Escritorio en Python Puro (Tkinter).
No requiere dependencias externas ni compiladores; corre directamente con `python3 gui_tkinter.py`.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import bridge
from core.models import EPSILON

class AutomataGUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("AutoLearn - Software Educativo de Autómatas Finitos (Python)")
        self.root.geometry("980x740")
        self.root.minsize(800, 600)

        # Configurar estilos ttk
        self.style = ttk.Style()
        self.style.theme_use("clam")

        self.resultado_actual = None
        self.crear_interfaz()

    def crear_interfaz(self):
        # Cabecera
        header = tk.Frame(self.root, bg="#1e1b4b", padx=16, pady=12)
        header.pack(fill="x")
        tk.Label(
            header,
            text="AutoLearn • Teoría de la Computación (100% Python)",
            fg="#e0e7ff",
            bg="#1e1b4b",
            font=("Helvetica", 14, "bold"),
        ).pack(side="left")

        # Pestañas principales
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=12, pady=8)

        # Tab 1: Modalidad A (Regex)
        self.tab_a = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(self.tab_a, text="Modalidad A: Expresión Regular")
        self.crear_tab_modalidad_a()

        # Tab 2: Modalidad B (Manual)
        self.tab_b = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(self.tab_b, text="Modalidad B: Entrada Manual")
        self.crear_tab_modalidad_b()

        # Tab 3: Visualización de Resultados y Tabla
        self.tab_resultados = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(self.tab_resultados, text="Tabla y Autómata Mínimo")
        self.crear_tab_resultados()

        # Tab 4: Trazabilidad Pedagógica (RF-10 / RF-13)
        self.tab_traza = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(self.tab_traza, text="Bitácora Educativa (RF-10/13)")
        self.crear_tab_traza()

        # Tab 5: Simulación de Cadenas (RF-12)
        self.tab_simulacion = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(self.tab_simulacion, text="Simulador de Cadenas (RF-12)")
        self.crear_tab_simulacion()

    def crear_tab_modalidad_a(self):
        frame = ttk.LabelFrame(self.tab_a, text="Definición Formal de Entrada", padding=12)
        frame.pack(fill="x", pady=6)

        ttk.Label(frame, text="RF-01: Alfabeto Σ (separado por comas):").grid(row=0, column=0, sticky="w", pady=4)
        self.txt_alfa_a = ttk.Entry(frame, width=40)
        self.txt_alfa_a.insert(0, "a, b")
        self.txt_alfa_a.grid(row=0, column=1, sticky="w", pady=4, padx=8)

        ttk.Label(frame, text="RF-02: Expresión Regular:").grid(row=1, column=0, sticky="w", pady=4)
        self.txt_regex = ttk.Entry(frame, width=40)
        self.txt_regex.insert(0, "(a|b)*ab")
        self.txt_regex.grid(row=1, column=1, sticky="w", pady=4, padx=8)

        # Botones de ejemplos
        btn_frame = ttk.Frame(self.tab_a)
        btn_frame.pack(fill="x", pady=8)
        ttk.Label(btn_frame, text="Cargar Casos de Prueba:", font=("Helvetica", 9, "bold")).pack(side="left", padx=4)

        ttk.Button(btn_frame, text="Caso 1: (a|b)*ab", command=lambda: self.cargar_ejemplo_a("a, b", "(a|b)*ab")).pack(side="left", padx=4)
        ttk.Button(btn_frame, text="a(a|b)*b", command=lambda: self.cargar_ejemplo_a("a, b", "a(a|b)*b")).pack(side="left", padx=4)
        ttk.Button(btn_frame, text="(0|1)*1(0|1)", command=lambda: self.cargar_ejemplo_a("0, 1", "(0|1)*1(0|1)")).pack(side="left", padx=4)

        btn_procesar = tk.Button(
            self.tab_a,
            text="⚡ Ejecutar Modalidad A (Thompson ➔ Subconjuntos ➔ Minimización)",
            bg="#4338ca",
            fg="white",
            font=("Helvetica", 10, "bold"),
            padx=12,
            pady=8,
            command=self.procesar_modalidad_a,
        )
        btn_procesar.pack(pady=12)

    def cargar_ejemplo_a(self, alfa, regex):
        self.txt_alfa_a.delete(0, tk.END)
        self.txt_alfa_a.insert(0, alfa)
        self.txt_regex.delete(0, tk.END)
        self.txt_regex.insert(0, regex)

    def crear_tab_modalidad_b(self):
        frame = ttk.LabelFrame(self.tab_b, text="Definición de la 5-Tupla M = (Q, Σ, δ, q0, F)", padding=12)
        frame.pack(fill="x", pady=6)

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

        # Presets
        presets_frame = ttk.Frame(self.tab_b)
        presets_frame.pack(fill="x", pady=6)
        ttk.Label(presets_frame, text="Cargar Casos Rápidos:", font=("Helvetica", 9, "bold")).pack(side="left", padx=4)
        ttk.Button(presets_frame, text="Caso 2: AFND con ε", command=self.cargar_caso_2).pack(side="left", padx=4)
        ttk.Button(presets_frame, text="Caso 3: AFD Redundante", command=self.cargar_caso_3).pack(side="left", padx=4)

        # Editor de transiciones
        t_frame = ttk.LabelFrame(self.tab_b, text="RF-04: Transiciones δ (Origen, Símbolo, Destino)", padding=8)
        t_frame.pack(fill="both", expand=True, pady=6)

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

        self.listbox_t = tk.Listbox(t_frame, height=6, font=("Courier", 10))
        self.listbox_t.pack(fill="both", expand=True, pady=4)

        # Cargar transiciones iniciales
        for t in [f"A, {EPSILON}, B", "A, 0, A", "B, 1, C", "C, 0, C"]:
            self.listbox_t.insert(tk.END, t)

        btn_procesar = tk.Button(
            self.tab_b,
            text="⚡ Ejecutar Modalidad B (Clasificar ➔ Limpiar Inaccesibles ➔ Minimizar)",
            bg="#059669",
            fg="white",
            font=("Helvetica", 10, "bold"),
            padx=12,
            pady=8,
            command=self.procesar_modalidad_b,
        )
        btn_procesar.pack(pady=8)

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
        self.txt_alfa_b.delete(0, tk.END); self.txt_alfa_b.insert(0, "0, 1")
        self.txt_estados_b.delete(0, tk.END); self.txt_estados_b.insert(0, "A, B, C")
        self.txt_inicial_b.delete(0, tk.END); self.txt_inicial_b.insert(0, "A")
        self.txt_finales_b.delete(0, tk.END); self.txt_finales_b.insert(0, "C")
        self.listbox_t.delete(0, tk.END)
        for t in [f"A, {EPSILON}, B", "A, 0, A", "B, 1, C", "C, 0, C"]:
            self.listbox_t.insert(tk.END, t)

    def cargar_caso_3(self):
        self.txt_alfa_b.delete(0, tk.END); self.txt_alfa_b.insert(0, "a, b")
        self.txt_estados_b.delete(0, tk.END); self.txt_estados_b.insert(0, "A, B, C, D, E")
        self.txt_inicial_b.delete(0, tk.END); self.txt_inicial_b.insert(0, "A")
        self.txt_finales_b.delete(0, tk.END); self.txt_finales_b.insert(0, "C, D")
        self.listbox_t.delete(0, tk.END)
        for t in ["A, a, B", "A, b, E", "B, a, C", "B, b, D", "C, a, C", "C, b, D", "D, a, D", "D, b, C", "E, a, E", "E, b, E"]:
            self.listbox_t.insert(tk.END, t)

    def crear_tab_resultados(self):
        # Diagnóstico de Determinismo (RF-05)
        self.lbl_tipo = tk.Label(self.tab_resultados, text="Tipo: Esperando procesamiento...", font=("Helvetica", 11, "bold"), fg="#312e81")
        self.lbl_tipo.pack(anchor="w", pady=4)

        self.txt_clasif_det = tk.Text(self.tab_resultados, height=4, font=("Courier", 9), bg="#f8fafc")
        self.txt_clasif_det.pack(fill="x", pady=4)

        ttk.Label(self.tab_resultados, text="RF-11: Tabla de Transición del AFD Mínimo:", font=("Helvetica", 10, "bold")).pack(anchor="w", pady=4)
        self.tree_tabla = ttk.Treeview(self.tab_resultados, show="headings", height=8)
        self.tree_tabla.pack(fill="both", expand=True, pady=4)

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

    def procesar_modalidad_a(self):
        try:
            res = bridge.procesar_modalidad_a_py(self.txt_alfa_a.get(), self.txt_regex.get())
            self.resultado_actual = res
            self.actualizar_vistas(res)
            self.notebook.select(self.tab_resultados)
            messagebox.showinfo("Éxito", "Modalidad A procesada exitosamente en Python.")
        except Exception as e:
            import traceback
            traceback.print_exc()
            msg = f"{type(e).__name__}: {e}" if str(e) else type(e).__name__
            messagebox.showerror("Error de Procesamiento", msg)

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
            self.actualizar_vistas(res)
            self.notebook.select(self.tab_resultados)
            messagebox.showinfo("Éxito", "Modalidad B procesada exitosamente en Python.")
        except Exception as e:
            import traceback
            traceback.print_exc()
            msg = f"{type(e).__name__}: {e}" if str(e) else type(e).__name__
            messagebox.showerror("Error de Procesamiento", msg)

    def actualizar_vistas(self, res):
        # 1. Clasificación
        clasif = res["clasificacion"]
        self.lbl_tipo.config(text=f"RF-05: {clasif['tipo']}")
        self.txt_clasif_det.delete("1.0", tk.END)
        self.txt_clasif_det.insert(tk.END, "\n".join(clasif["razones"]))

        # 2. Tabla de Transición
        min_aut = res["automataMinimo"]
        tabla = min_aut["tabla"]
        cols = ["Estado"] + tabla["columnas"]
        self.tree_tabla["columns"] = cols
        for c in cols:
            self.tree_tabla.heading(c, text=c)
            self.tree_tabla.column(c, width=110, anchor="center")

        for item in self.tree_tabla.get_children():
            self.tree_tabla.delete(item)

        for row in tabla["filas"]:
            est = row["estado"]
            marca = ("➔ " if est.get("esInicial") else "") + ("★ " if est.get("esFinal") else "")
            est_str = f"{marca}{est['id']}"
            vals = [est_str] + [row["celdas"].get(c, "—") for c in tabla["columnas"]]
            self.tree_tabla.insert("", tk.END, values=vals)

        # 3. Bitácora de Trazabilidad
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
