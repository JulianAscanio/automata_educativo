import React, { useState } from "react";
import { EPSILON } from "../core/types";
import { Plus, Trash2, PlayCircle, AlertCircle, Sparkles } from "lucide-react";

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
      setErrorLocal("Todos los campos de la transición (origen, símbolo y destino) son requeridos.");
      return;
    }
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
    if (preset === "caso2") {
      // AFND con ε (Caso 2 de la matriz)
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
      // AFD que requiere minimización pura (Caso 3 de la matriz)
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
      // Autómata con estados inaccesibles (RF-07)
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
    <form onSubmit={handleSubmit} className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Modalidad B: Desde Autómata Existente (Entrada Manual RF-04)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingresa la 5-tupla formal: Estados Q, Alfabeto Σ, Estado Inicial q0, Finales F y Transiciones δ.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-amber-400" /> Cargar caso:
          </span>
          <button
            type="button"
            onClick={() => cargarPreset("caso2")}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700"
          >
            AFND con ε
          </button>
          <button
            type="button"
            onClick={() => cargarPreset("caso3")}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700"
          >
            AFD Redundante
          </button>
          <button
            type="button"
            onClick={() => cargarPreset("inaccesibles")}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700"
          >
            Con Inaccesibles
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            RF-01: Alfabeto Σ
          </label>
          <input
            type="text"
            value={alfabetoStr}
            onChange={(e) => setAlfabetoStr(e.target.value)}
            placeholder="0, 1"
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Conjunto de Estados Q
          </label>
          <input
            type="text"
            value={estadosStr}
            onChange={(e) => setEstadosStr(e.target.value)}
            placeholder="q0, q1, q2"
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Estado Inicial q0
          </label>
          <input
            type="text"
            value={inicialStr}
            onChange={(e) => setInicialStr(e.target.value)}
            placeholder="q0"
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Estados Finales F
          </label>
          <input
            type="text"
            value={finalesStr}
            onChange={(e) => setFinalesStr(e.target.value)}
            placeholder="q1, q2"
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Editor de Transiciones δ */}
      <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            RF-04: Transiciones δ(Origen, Símbolo) ➔ Destino ({transiciones.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Usa el botón '{EPSILON}' para añadir transiciones épsilon.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={nuevoOrigen}
            onChange={(e) => setNuevoOrigen(e.target.value)}
            placeholder="Origen"
            className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-200"
          />
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={nuevoSimbolo}
              onChange={(e) => setNuevoSimbolo(e.target.value)}
              placeholder="Símbolo"
              className="w-20 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-200"
            />
            <button
              type="button"
              onClick={() => setNuevoSimbolo(EPSILON)}
              className="px-2 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 rounded border border-indigo-700 text-xs font-mono font-bold"
              title="Insertar épsilon (ε)"
            >
              {EPSILON}
            </button>
          </div>
          <span className="text-slate-500 font-bold">➔</span>
          <input
            type="text"
            value={nuevoDestino}
            onChange={(e) => setNuevoDestino(e.target.value)}
            placeholder="Destino"
            className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-200"
          />
          <button
            type="button"
            onClick={agregarTransicion}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        {/* Lista de transiciones agregadas */}
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar pt-1">
          {transiciones.map((t, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
            >
              <span>δ({t.origen}, '{t.simbolo}') ➔ {t.destino}</span>
              <button
                type="button"
                onClick={() => eliminarTransicion(idx)}
                className="text-slate-500 hover:text-rose-400 p-0.5"
                title="Eliminar transición"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {errorLocal && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorLocal}</span>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-all"
        >
          <PlayCircle className="w-4 h-4" /> Procesar Modalidad B
        </button>
      </div>
    </form>
  );
};
