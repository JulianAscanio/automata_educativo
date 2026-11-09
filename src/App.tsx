import React, { useState, useEffect } from "react";
import { Alphabet } from "./core/Alphabet";
import { Automata } from "./core/Automata";
import { PedagogicalTracer } from "./core/Tracer";
import { ThompsonAlgorithm } from "./algorithms/thompson";
import { AutomataClassifier, ClasificacionResultado } from "./algorithms/classifier";
import { SubsetConstruction } from "./algorithms/subsetConstruction";
import { DFAMinimizer } from "./algorithms/minimization";
import { InputModalidadA } from "./components/InputModalidadA";
import { InputModalidadB } from "./components/InputModalidadB";
import { ClassificationCard } from "./components/ClassificationCard";
import { GraphViewer } from "./components/GraphViewer";
import { TransitionTable } from "./components/TransitionTable";
import { EducationalTrace } from "./components/EducationalTrace";
import { StringSimulatorView } from "./components/StringSimulatorView";
import { Network, FileCode, CheckCircle, GraduationCap, Cloud } from "lucide-react";

export function App() {
  const [modalidad, setModalidad] = useState<"A" | "B">("A");

  // Resultados del flujo
  const [automataInicial, setAutomataInicial] = useState<Automata | null>(null);
  const [clasificacionInicial, setClasificacionInicial] = useState<ClasificacionResultado | null>(null);
  const [automataDFA, setAutomataDFA] = useState<Automata | null>(null);
  const [automataMinimo, setAutomataMinimo] = useState<Automata | null>(null);

  // Trazas pedagógicas
  const [tracerThompson, setTracerThompson] = useState<PedagogicalTracer | null>(null);
  const [tracerSubconjuntos, setTracerSubconjuntos] = useState<PedagogicalTracer | null>(null);
  const [tracerMinimizacion, setTracerMinimizacion] = useState<PedagogicalTracer | null>(null);

  // Vista de etapa activa
  const [etapaVisual, setEtapaVisual] = useState<"inicial" | "determinizado" | "minimo">("minimo");
  const [estadoActivo, setEstadoActivo] = useState<string | undefined>(undefined);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Procesamiento para Modalidad A
  const procesarModalidadA = (alfaStr: string, regexStr: string) => {
    setErrorGlobal(null);
    try {
      const simbolos = Alphabet.parsearCadena(alfaStr);
      const alfabeto = new Alphabet(simbolos);

      // 1. Thompson (Regex -> ε-AFND)
      const { automata: nfa, tracer: tThompson } = new ThompsonAlgorithm(alfabeto).construir(regexStr);
      setAutomataInicial(nfa);
      setTracerThompson(tThompson);

      const clasif = AutomataClassifier.clasificar(nfa);
      setClasificacionInicial(clasif);

      // 2. Determinización (Subset Construction RF-06)
      const { afd, tracer: tSub } = SubsetConstruction.determinizar(nfa);
      setAutomataDFA(afd);
      setTracerSubconjuntos(tSub);

      // 3. Minimización (RF-09)
      const { afdMinimo, tracer: tMin } = DFAMinimizer.minimizar(afd);
      setAutomataMinimo(afdMinimo);
      setTracerMinimizacion(tMin);

      setEtapaVisual("minimo");
    } catch (err: any) {
      setErrorGlobal(err.message || String(err));
    }
  };

  // Procesamiento para Modalidad B
  const procesarModalidadB = (datos: {
    alfabetoStr: string;
    estadosStr: string;
    inicialStr: string;
    finalesStr: string;
    transiciones: Array<{ origen: string; simbolo: string; destino: string }>;
  }) => {
    setErrorGlobal(null);
    try {
      const simbolos = Alphabet.parsearCadena(datos.alfabetoStr);
      const alfabeto = new Alphabet(simbolos);
      const aut = new Automata(alfabeto);

      const estados = datos.estadosStr
        .replace(/^[{[(\]]+|[}\])]+$/g, "")
        .split(",")
        .map((s) => s.trim().replace(/^['"]+|['"]+$/g, ""))
        .filter((s) => s.length > 0);
      const inicial = datos.inicialStr.trim().replace(/^['"]+|['"]+$/g, "");
      const finales = new Set(
        datos.finalesStr
          .replace(/^[{[(\]]+|[}\])]+$/g, "")
          .split(",")
          .map((s) => s.trim().replace(/^['"]+|['"]+$/g, ""))
          .filter((s) => s.length > 0)
      );

      if (!estados.includes(inicial)) {
        throw new Error(`El estado inicial '${inicial}' no está en la lista de estados Q.`);
      }

      for (const e of estados) {
        aut.agregarEstado(e, e === inicial, finales.has(e));
      }

      for (const t of datos.transiciones) {
        aut.agregarTransicion(
          t.origen.trim().replace(/^['"]+|['"]+$/g, ""),
          t.simbolo.trim().replace(/^['"]+|['"]+$/g, ""),
          t.destino.trim().replace(/^['"]+|['"]+$/g, "")
        );
      }

      setAutomataInicial(aut);
      setTracerThompson(null);

      // RF-05: Clasificador
      const clasif = AutomataClassifier.clasificar(aut);
      setClasificacionInicial(clasif);

      let afdParaMinimizar = aut;

      if (!clasif.esDeterminista) {
        // Ejecutar Subset Construction (RF-06)
        const { afd, tracer: tSub } = SubsetConstruction.determinizar(aut);
        setAutomataDFA(afd);
        setTracerSubconjuntos(tSub);
        afdParaMinimizar = afd;
      } else {
        // Es AFD directo: saltar conversión
        setAutomataDFA(null);
        setTracerSubconjuntos(null);
      }

      // Minimización (RF-09 & RF-07)
      const { afdMinimo, tracer: tMin } = DFAMinimizer.minimizar(afdParaMinimizar);
      setAutomataMinimo(afdMinimo);
      setTracerMinimizacion(tMin);

      setEtapaVisual("minimo");
    } catch (err: any) {
      setErrorGlobal(err.message || String(err));
    }
  };

  // Cargar caso inicial por defecto al montar
  useEffect(() => {
    procesarModalidadA("a, b", "(a|b)*ab");
  }, []);

  // Determinar autómata a visualizar según la pestaña de etapa
  const autVisualActivo =
    etapaVisual === "minimo"
      ? automataMinimo
      : etapaVisual === "determinizado"
      ? automataDFA || automataInicial
      : automataInicial;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar Superior */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 shadow-md">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">AutoLearn</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  v2.0 Académico
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <Cloud className="w-3 h-3" /> Netlify Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">Software Educativo Formal de Autómatas Finitos</p>
            </div>
          </div>

          {/* Selector de Modalidad */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setModalidad("A")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                modalidad === "A"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" /> Modalidad A (Regex)
            </button>
            <button
              onClick={() => setModalidad("B")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                modalidad === "B"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Modalidad B (Manual)
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-6 flex-1">
        {/* Panel de Entrada según Modalidad */}
        <section>
          {modalidad === "A" ? (
            <InputModalidadA onProcesar={procesarModalidadA} />
          ) : (
            <InputModalidadB onProcesar={procesarModalidadB} />
          )}
        </section>

        {errorGlobal && (
          <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs font-mono">
            {errorGlobal}
          </div>
        )}

        {/* Clasificación y Diagnóstico Formal (RF-05) */}
        {clasificacionInicial && (
          <section>
            <ClassificationCard resultado={clasificacionInicial} />
          </section>
        )}

        {/* Barra de Navegación de Etapas de Transformación */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Etapa visual:</span>
            {automataInicial && (
              <button
                onClick={() => setEtapaVisual("inicial")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  etapaVisual === "inicial"
                    ? "bg-slate-800 text-indigo-300 border border-indigo-700/60 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                1. Autómata Inicial {tracerThompson ? "(Thompson)" : ""}
              </button>
            )}

            {automataDFA && (
              <button
                onClick={() => setEtapaVisual("determinizado")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  etapaVisual === "determinizado"
                    ? "bg-slate-800 text-indigo-300 border border-indigo-700/60 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                2. AFD Determinizado (RF-06)
              </button>
            )}

            {automataMinimo && (
              <button
                onClick={() => setEtapaVisual("minimo")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  etapaVisual === "minimo"
                    ? "bg-indigo-900/40 text-indigo-300 border border-indigo-500 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                3. AFD Mínimo Final (RF-09)
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Mostrando:{" "}
            <span className="text-slate-200 font-bold">
              {etapaVisual === "minimo"
                ? "AFD Mínimo"
                : etapaVisual === "determinizado"
                ? "AFD tras Subconjuntos"
                : "Autómata Base"}
            </span>{" "}
            ({autVisualActivo?.estados.size || 0} estados,{" "}
            {autVisualActivo?.obtenerTodasLasTransiciones().length || 0} transiciones)
          </div>
        </div>

        {/* Grilla: Diagrama Visual (Grafo) y Tabla de Transición (RF-11) */}
        {autVisualActivo && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Grafo Interactivo (RF-11) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-400" /> RF-11: Diagrama de Transición (Grafo Interactivo)
                </h3>
              </div>
              <GraphViewer automata={autVisualActivo} estadoActivo={estadoActivo} />
            </div>

            {/* Tabla de Transición Formal (RF-11) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  RF-11: Tabla de Transición
                </h3>
              </div>
              <TransitionTable automata={autVisualActivo} estadoActivo={estadoActivo} />
            </div>
          </section>
        )}

        {/* Simulador de Cadenas (RF-12) */}
        {autVisualActivo && (
          <section>
            <StringSimulatorView
              automata={autVisualActivo}
              onEstadoActivoChange={setEstadoActivo}
            />
          </section>
        )}

        {/* Bitácoras Pedagógicas y Trazabilidad (RF-10 / RF-13) */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
            RF-10 & RF-13: Bitácora Educativa de Transformación Paso a Paso
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracerMinimizacion && (
              <EducationalTrace tracer={tracerMinimizacion} />
            )}
            {tracerSubconjuntos && (
              <EducationalTrace tracer={tracerSubconjuntos} />
            )}
            {tracerThompson && (
              <div className="md:col-span-2">
                <EducationalTrace tracer={tracerThompson} />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        AutoLearn • Software Educativo de Teoría de la Computación • Arquitectura Desplegable en Netlify (Vite + React + TypeScript)
      </footer>
    </div>
  );
}
