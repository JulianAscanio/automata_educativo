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
import { Network, Table2, PlayCircle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

type PanelTab = "tabla" | "simulador" | "pasos";
type TraceKey = "thompson" | "subconjuntos" | "minimizacion";

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

  // Navegación UI
  const [etapaVisual, setEtapaVisual] = useState<"inicial" | "determinizado" | "minimo">("minimo");
  const [panelTab, setPanelTab] = useState<PanelTab>("tabla");
  const [traceActiva, setTraceActiva] = useState<TraceKey>("minimizacion");
  const [mostrarDiagnostico, setMostrarDiagnostico] = useState<boolean>(false);

  const [estadoActivo, setEstadoActivo] = useState<string | undefined>(undefined);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Procesamiento para Expresión Regular
  const procesarModalidadA = (alfaStr: string, regexStr: string) => {
    setErrorGlobal(null);
    try {
      const simbolos = Alphabet.parsearCadena(alfaStr);
      const alfabeto = new Alphabet(simbolos);

      const { automata: nfa, tracer: tThompson } = new ThompsonAlgorithm(alfabeto).construir(regexStr);
      setAutomataInicial(nfa);
      setTracerThompson(tThompson);

      const clasif = AutomataClassifier.clasificar(nfa);
      setClasificacionInicial(clasif);

      const { afd, tracer: tSub } = SubsetConstruction.determinizar(nfa);
      setAutomataDFA(afd);
      setTracerSubconjuntos(tSub);

      const { afdMinimo, tracer: tMin } = DFAMinimizer.minimizar(afd);
      setAutomataMinimo(afdMinimo);
      setTracerMinimizacion(tMin);

      setEtapaVisual("minimo");
      setTraceActiva("minimizacion");
    } catch (err: any) {
      setErrorGlobal(err.message || String(err));
    }
  };

  // Procesamiento para Autómata Manual
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

      Automata.validarEstadosFinales(estados, finales);
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

      const clasif = AutomataClassifier.clasificar(aut);
      setClasificacionInicial(clasif);

      let afdParaMinimizar = aut;

      if (!clasif.esDeterminista) {
        const { afd, tracer: tSub } = SubsetConstruction.determinizar(aut);
        setAutomataDFA(afd);
        setTracerSubconjuntos(tSub);
        afdParaMinimizar = afd;
      } else {
        setAutomataDFA(null);
        setTracerSubconjuntos(null);
      }

      const { afdMinimo, tracer: tMin } = DFAMinimizer.minimizar(afdParaMinimizar);
      setAutomataMinimo(afdMinimo);
      setTracerMinimizacion(tMin);

      setEtapaVisual("minimo");
      setTraceActiva("minimizacion");
    } catch (err: any) {
      setErrorGlobal(err.message || String(err));
    }
  };

  useEffect(() => {
    procesarModalidadA("a, b", "(a|b)*ab");
  }, []);

  const autVisualActivo =
    etapaVisual === "minimo"
      ? automataMinimo
      : etapaVisual === "determinizado"
      ? automataDFA || automataInicial
      : automataInicial;

  const trazasDisponibles: Array<{ key: TraceKey; label: string; tracer: PedagogicalTracer }> = [
    ...(tracerThompson ? [{ key: "thompson" as const, label: "Thompson", tracer: tracerThompson }] : []),
    ...(tracerSubconjuntos ? [{ key: "subconjuntos" as const, label: "Subconjuntos", tracer: tracerSubconjuntos }] : []),
    ...(tracerMinimizacion ? [{ key: "minimizacion" as const, label: "Minimización", tracer: tracerMinimizacion }] : []),
  ];

  const trazaSeleccionada =
    trazasDisponibles.find((t) => t.key === traceActiva)?.tracer || trazasDisponibles[0]?.tracer;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header minimalista */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3">
        <div className="max-w-[1536px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-tight text-white leading-none">
                AutoLearn
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Autómatas finitos</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setModalidad("A")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                modalidad === "A"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Expresión Regular
            </button>
            <button
              onClick={() => setModalidad("B")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                modalidad === "B"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Autómata Manual
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-[1536px] mx-auto w-full p-4 lg:p-6 space-y-5 flex-1">
        {/* Entrada */}
        <section>
          {modalidad === "A" ? (
            <InputModalidadA onProcesar={procesarModalidadA} />
          ) : (
            <InputModalidadB onProcesar={procesarModalidadB} />
          )}
        </section>

        {errorGlobal && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/70 text-rose-300 rounded-xl text-xs font-mono">
            {errorGlobal}
          </div>
        )}

        {/* Barra de etapas + clasificación compacta */}
        {autVisualActivo && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {automataInicial && (
                  <button
                    onClick={() => setEtapaVisual("inicial")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                      etapaVisual === "inicial"
                        ? "bg-slate-800 text-white border-slate-700"
                        : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    1. Inicial {tracerThompson ? "(Thompson)" : ""}
                  </button>
                )}

                {automataDFA && (
                  <button
                    onClick={() => setEtapaVisual("determinizado")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                      etapaVisual === "determinizado"
                        ? "bg-slate-800 text-white border-slate-700"
                        : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    2. Determinizado
                  </button>
                )}

                {automataMinimo && (
                  <button
                    onClick={() => setEtapaVisual("minimo")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                      etapaVisual === "minimo"
                        ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                        : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    {automataDFA ? "3. " : "2. "}AFD Mínimo
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500 font-mono">
                  {autVisualActivo.estados.size} estados ·{" "}
                  {autVisualActivo.obtenerTodasLasTransiciones().length} transiciones
                </span>

                {clasificacionInicial && (
                  <button
                    type="button"
                    onClick={() => setMostrarDiagnostico((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 transition-colors"
                  >
                    <span className="font-medium">{clasificacionInicial.tipo}</span>
                    {mostrarDiagnostico ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {mostrarDiagnostico && clasificacionInicial && (
              <ClassificationCard resultado={clasificacionInicial} />
            )}
          </section>
        )}

        {/* Área de Trabajo Principal: Grafo + Panel de Pestañas */}
        {autVisualActivo && (
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Grafo Interactivo */}
            <div className="xl:col-span-7 space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-medium text-slate-400">
                  Diagrama de estados
                </h2>
                <span className="text-xs text-slate-500">
                  Arrastra los nodos para acomodarlos
                </span>
              </div>
              <GraphViewer automata={autVisualActivo} estadoActivo={estadoActivo} />
            </div>

            {/* Panel Derecho con Pestañas */}
            <div className="xl:col-span-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden">
              <div className="flex border-b border-slate-800/80 p-1.5 gap-1 bg-slate-950/40">
                <button
                  onClick={() => setPanelTab("tabla")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-colors ${
                    panelTab === "tabla"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" /> Tabla
                </button>
                <button
                  onClick={() => setPanelTab("simulador")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-colors ${
                    panelTab === "simulador"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <PlayCircle className="w-3.5 h-3.5" /> Probar cadena
                </button>
                <button
                  onClick={() => setPanelTab("pasos")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-colors ${
                    panelTab === "pasos"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> Paso a paso
                </button>
              </div>

              <div>
                {panelTab === "tabla" && (
                  <TransitionTable automata={autVisualActivo} estadoActivo={estadoActivo} />
                )}

                {panelTab === "simulador" && (
                  <StringSimulatorView
                    automata={autVisualActivo}
                    onEstadoActivoChange={setEstadoActivo}
                  />
                )}

                {panelTab === "pasos" && (
                  <div className="p-4 space-y-4">
                    {trazasDisponibles.length > 1 && (
                      <div className="flex flex-wrap gap-1.5">
                        {trazasDisponibles.map((t) => (
                          <button
                            key={t.key}
                            onClick={() => setTraceActiva(t.key)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                              trazaSeleccionada === t.tracer
                                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {trazaSeleccionada && <EducationalTrace tracer={trazaSeleccionada} />}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-900 px-4 py-3 text-center text-xs text-slate-600">
        AutoLearn · Teoría de la Computación
      </footer>
    </div>
  );
}
