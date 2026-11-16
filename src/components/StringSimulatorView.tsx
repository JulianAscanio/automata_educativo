import React, { useState, useEffect } from "react";
import { Automata } from "../core/Automata";
import { StringSimulator } from "../algorithms/simulator";
import { AutomataClassifier } from "../algorithms/classifier";
import { ResultadoSimulacion } from "../core/types";
import { Play, SkipForward, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

interface StringSimulatorViewProps {
  automata: Automata;
  onEstadoActivoChange?: (estadoId?: string) => void;
}

export const StringSimulatorView: React.FC<StringSimulatorViewProps> = ({
  automata,
  onEstadoActivoChange,
}) => {
  const [cadena, setCadena] = useState<string>("");
  const [resultado, setResultado] = useState<ResultadoSimulacion | null>(null);
  const [pasoActualIdx, setPasoActualIdx] = useState<number>(0);

  // Reiniciar simulación al cambiar de autómata o etapa
  useEffect(() => {
    setResultado(null);
    setPasoActualIdx(0);
    onEstadoActivoChange?.(undefined);
  }, [automata]);

  const ejecutarSimulacion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = StringSimulator.simular(automata, cadena);
    setResultado(res);
    setPasoActualIdx(0);
    if (res.pasos.length > 0) {
      onEstadoActivoChange?.(res.pasos[0].estadoActual);
    }
  };

  const pasoSiguiente = () => {
    if (!resultado) return;
    if (pasoActualIdx < resultado.pasos.length - 1) {
      const sigIdx = pasoActualIdx + 1;
      setPasoActualIdx(sigIdx);
      onEstadoActivoChange?.(resultado.pasos[sigIdx].estadoActual);
    }
  };

  const reiniciar = () => {
    setResultado(null);
    setPasoActualIdx(0);
    onEstadoActivoChange?.(undefined);
  };

  const pasoActivo = resultado?.pasos[pasoActualIdx];

  if (!AutomataClassifier.clasificar(automata).esDeterminista) {
    return (
      <div className="p-4 text-sm text-slate-300" role="status">
        Este autómata es no determinista. Selecciona la etapa <strong>Determinizado</strong> o <strong>AFD Mínimo</strong> para probar cadenas y consultar su recorrido.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <form onSubmit={ejecutarSimulacion} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={cadena}
          onChange={(e) => setCadena(e.target.value)}
          placeholder="Cadena a probar (ej: aab)"
          className="flex-1 min-w-[140px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Probar
        </button>
        {resultado && (
          <>
            <button
              type="button"
              onClick={pasoSiguiente}
              disabled={pasoActualIdx >= resultado.pasos.length - 1}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-medium transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" /> Siguiente
            </button>
            <button
              type="button"
              onClick={reiniciar}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/60 rounded-xl transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </form>

      {!resultado && (
        <p className="text-xs text-slate-500">
          Escribe una cadena (o déjala vacía para probar ε) y presiona <strong>Probar</strong> para recorrer el autómata paso a paso.
        </p>
      )}

      {resultado && pasoActivo && (
        <div className="space-y-3">
          {/* Cinta de símbolos */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-xs text-slate-500 block mb-2">
              Símbolos de entrada
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {cadena.length === 0 ? (
                <div className="px-3 py-1.5 border border-slate-800 bg-slate-900 rounded-lg font-mono text-xs text-slate-400">
                  Cadena vacía (ε)
                </div>
              ) : (
                cadena.split("").map((char, idx) => {
                  const yaConsumido = idx < pasoActualIdx;
                  const esActual = idx === pasoActualIdx - 1;

                  return (
                    <div
                      key={idx}
                      className={`w-8 h-9 flex items-center justify-center font-mono text-sm font-semibold rounded-lg border transition-all ${
                        esActual
                          ? "bg-sky-500/20 border-sky-400 text-sky-200 ring-2 ring-sky-400/25"
                          : yaConsumido
                          ? "bg-slate-900/40 border-slate-800 text-slate-600 line-through"
                          : "bg-slate-900 border-slate-800 text-slate-200"
                      }`}
                    >
                      {char}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Paso actual */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>
                Paso <strong className="text-slate-200">{pasoActualIdx + 1}</strong> de{" "}
                {resultado.pasos.length}
              </span>
              <span>
                Estado:{" "}
                <strong className="font-mono text-sky-300 px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-800/60">
                  {pasoActivo.estadoActual}
                </strong>
              </span>
            </div>
            <p className="text-slate-300 font-mono leading-relaxed">
              {pasoActivo.descripcion}
            </p>
          </div>

          {/* Veredicto Final */}
          {pasoActualIdx === resultado.pasos.length - 1 && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                resultado.aceptada
                  ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-200"
                  : "bg-rose-950/30 border-rose-800/60 text-rose-200"
              }`}
            >
              {resultado.aceptada ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-xs">
                  {resultado.aceptada ? "Cadena aceptada" : "Cadena rechazada"}
                </div>
                <div className="text-xs text-slate-300 mt-0.5 font-mono">
                  {resultado.mensajeFinal}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
