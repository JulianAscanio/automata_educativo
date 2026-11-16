import React, { useState } from "react";
import { EPSILON } from "../core/types";
import { Plus, X, Play, AlertCircle } from "lucide-react";

interface TransicionInput {
  origen: string;
  simbolo: string;
  destino: string;
}

interface InputModalidadBProps {
  onProcesar: (datos: {
    alfabetoStr: string;
    estadosStr: string;
    inicialStr: string;
    finalesStr: string;
    transiciones: TransicionInput[];
  }) => void;
}

export const InputModalidadB: React.FC<InputModalidadBProps> = ({ onProcesar }) => {
  const [alfabetoStr, setAlfabetoStr] = useState<string>("0, 1");
  const [estadosStr, setEstadosStr] = useState<string>("A, B, C");
  const [inicialStr, setInicialStr] = useState<string>("A");
  const [finalesStr, setFinalesStr] = useState<string>("C");
  const [transiciones, setTransiciones] = useState<TransicionInput[]>([
    { origen: "A", simbolo: EPSILON, destino: "B" },
    { origen: "A", simbolo: "0", destino: "A" },
    { origen: "B", simbolo: "1", destino: "C" },
    { origen: "C", simbolo: "0", destino: "C" },
  ]);

  const [nuevoOrigen, setNuevoOrigen] = useState<string>("A");
  const [nuevoSimbolo, setNuevoSimbolo] = useState<string>("0");
  const [nuevoDestino, setNuevoDestino] = useState<string>("B");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const agregarTransicion = () => {
    if (!nuevoOrigen.trim() || !nuevoSimbolo.trim() || !nuevoDestino.trim()) {
      setErrorLocal("Completa origen, símbolo y destino para agregar una transición.");
      return;
    }
    setErrorLocal(null);
    setTransiciones((prev) => [
      ...prev,
      {
        origen: nuevoOrigen.trim(),
        simbolo: nuevoSimbolo.trim(),
        destino: nuevoDestino.trim(),
      },
    ]);
  };

  const eliminarTransicion = (index: number) => {
    setTransiciones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorLocal(null);
    try {
      onProcesar({
        alfabetoStr,
        estadosStr,
        inicialStr,
        finalesStr,
        transiciones,
      });
    } catch (err: any) {
      setErrorLocal(err.message || String(err));
    }
  };

  const cargarPreset = (preset: "caso2" | "caso3" | "inaccesibles") => {
    setErrorLocal(null);
    if (preset === "caso2") {
      setAlfabetoStr("0, 1");
      setEstadosStr("A, B, C");
      setInicialStr("A");
      setFinalesStr("C");
      setTransiciones([
        { origen: "A", simbolo: EPSILON, destino: "B" },
        { origen: "A", simbolo: "0", destino: "A" },
        { origen: "B", simbolo: "1", destino: "C" },
        { origen: "C", simbolo: "0", destino: "C" },
      ]);
    } else if (preset === "caso3") {
      setAlfabetoStr("a, b");
      setEstadosStr("A, B, C, D, E");
      setInicialStr("A");
      setFinalesStr("C, D");
      setTransiciones([
        { origen: "A", simbolo: "a", destino: "B" },
        { origen: "A", simbolo: "b", destino: "E" },
        { origen: "B", simbolo: "a", destino: "C" },
        { origen: "B", simbolo: "b", destino: "D" },
        { origen: "C", simbolo: "a", destino: "C" },
        { origen: "C", simbolo: "b", destino: "D" },
        { origen: "D", simbolo: "a", destino: "D" },
        { origen: "D", simbolo: "b", destino: "C" },
        { origen: "E", simbolo: "a", destino: "E" },
        { origen: "E", simbolo: "b", destino: "E" },
      ]);
    } else if (preset === "inaccesibles") {
      setAlfabetoStr("0, 1");
      setEstadosStr("q0, q1, q2, q_inacc");
      setInicialStr("q0");
      setFinalesStr("q2");
      setTransiciones([
        { origen: "q0", simbolo: "0", destino: "q1" },
        { origen: "q1", simbolo: "1", destino: "q2" },
        { origen: "q_inacc", simbolo: "0", destino: "q2" },
      ]);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-4"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Alfabeto (Σ)
          </label>
          <input
            type="text"
            value={alfabetoStr}
            onChange={(e) => setAlfabetoStr(e.target.value)}
            placeholder="0, 1"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Estados (Q)
          </label>
          <input
            type="text"
            value={estadosStr}
            onChange={(e) => setEstadosStr(e.target.value)}
            placeholder="q0, q1, q2"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Estado inicial (q₀)
          </label>
          <input
            type="text"
            value={inicialStr}
            onChange={(e) => setInicialStr(e.target.value)}
            placeholder="q0"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Estados finales (F)
          </label>
          <input
            type="text"
            value={finalesStr}
            onChange={(e) => setFinalesStr(e.target.value)}
            placeholder="q1, q2"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Transiciones */}
      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-400">
            Transiciones ({transiciones.length})
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500">Ejemplos:</span>
            <button
              type="button"
              onClick={() => cargarPreset("caso2")}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 transition-colors"
            >
              AFND con ε
            </button>
            <button
              type="button"
              onClick={() => cargarPreset("caso3")}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 transition-colors"
            >
              AFD redundante
            </button>
            <button
              type="button"
              onClick={() => cargarPreset("inaccesibles")}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 transition-colors"
            >
              Con inaccesibles
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={nuevoOrigen}
            onChange={(e) => setNuevoOrigen(e.target.value)}
            placeholder="Origen"
            className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={nuevoSimbolo}
              onChange={(e) => setNuevoSimbolo(e.target.value)}
              placeholder="Símbolo"
              className="w-20 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => setNuevoSimbolo(EPSILON)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-300 rounded-lg border border-slate-800 text-xs font-mono font-semibold"
              title="Insertar épsilon (ε)"
            >
              {EPSILON}
            </button>
          </div>
          <span className="text-slate-500 text-xs">→</span>
          <input
            type="text"
            value={nuevoDestino}
            onChange={(e) => setNuevoDestino(e.target.value)}
            placeholder="Destino"
            className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={agregarTransicion}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        {transiciones.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar pt-1">
            {transiciones.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
              >
                <span>
                  {t.origen} <span className="text-indigo-400">({t.simbolo})</span> → {t.destino}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarTransicion(idx)}
                  className="text-slate-500 hover:text-rose-400 transition-colors"
                  title="Eliminar transición"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {errorLocal && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/70 text-rose-300 rounded-xl text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorLocal}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Analizar y minimizar
        </button>
      </div>
    </form>
  );
};
