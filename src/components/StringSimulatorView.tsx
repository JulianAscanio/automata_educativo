import React, { useState } from "react";
import { Automata } from "../core/Automata";
import { StringSimulator } from "../algorithms/simulator";
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

  const ejecutarSimulacion = () => {
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

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-semibold text-slate-100 text-sm">
            RF-12: Simulador Interactivo de Cadenas (Recorrido de Cinta)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingresa una cadena para evaluar su pertenencia al lenguaje L(M) en el autómata actual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={cadena}
            onChange={(e) => setCadena(e.target.value)}
            placeholder="Ej: aab, 0101, etc."
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 w-44"
          />
          <button
            onClick={ejecutarSimulacion}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> Simular
          </button>
          {resultado && (
            <>
              <button
                onClick={pasoSiguiente}
                disabled={pasoActualIdx >= resultado.pasos.length - 1}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" /> Siguiente
              </button>
              <button
                onClick={reiniciar}
                className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/60 rounded-lg"
                title="Reiniciar"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {resultado && pasoActivo && (
        <div className="space-y-4">
          {/* Cinta de símbolos */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block mb-2">
              Cinta de Entrada (Tape)
            </span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {cadena.length === 0 ? (
                <div className="px-3 py-2 border border-slate-800 bg-slate-900 rounded font-mono text-xs text-slate-500">
                  Cadena vacía (ε)
                </div>
              ) : (
                cadena.split("").map((char, idx) => {
                  const yaConsumido = idx < pasoActualIdx;
                  const esActual = idx === pasoActualIdx - 1;

                  return (
                    <div
                      key={idx}
                      className={`w-9 h-10 flex items-center justify-center font-mono text-sm font-bold rounded border transition-all ${
                        esActual
                          ? "bg-sky-500/20 border-sky-400 text-sky-200 shadow-md ring-2 ring-sky-400/30 scale-105"
                          : yaConsumido
                          ? "bg-slate-900/40 border-slate-800 text-slate-600 line-through"
                          : "bg-slate-900 border-slate-700 text-slate-200"
                      }`}
                    >
                      {char}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Estado actual y descripción pedagógica del paso */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3.5 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs font-mono">
            <div>
              <span className="text-slate-400">Paso actual: </span>
              <span className="font-bold text-indigo-300">
                {pasoActualIdx + 1} de {resultado.pasos.length}
              </span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-slate-400">Estado actual: </span>
              <span className="font-bold text-sky-300 px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
                {pasoActivo.estadoActual}
              </span>
            </div>
            <div className="text-slate-300 text-right">{pasoActivo.descripcion}</div>
          </div>

          {/* Veredicto Final */}
          {pasoActualIdx === resultado.pasos.length - 1 && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                resultado.aceptada
                  ? "bg-emerald-950/30 border-emerald-700 text-emerald-200"
                  : "bg-rose-950/30 border-rose-800 text-rose-200"
              }`}
            >
              {resultado.aceptada ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {resultado.aceptada ? "CADENA ACEPTADA (w ∈ L)" : "CADENA RECHAZADA (w ∉ L)"}
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
