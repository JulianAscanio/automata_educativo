import React, { useState } from "react";
import { Sparkles, PlayCircle, AlertCircle } from "lucide-react";

interface InputModalidadAProps {
  onProcesar: (alfabetoStr: string, regexStr: string) => void;
}

export const InputModalidadA: React.FC<InputModalidadAProps> = ({ onProcesar }) => {
  const [alfabetoInput, setAlfabetoInput] = useState<string>("a, b");
  const [regexInput, setRegexInput] = useState<string>("(a|b)*ab");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const ejemplos = [
    { label: "Termina en 'ab' (a|b)*ab", alfa: "a, b", reg: "(a|b)*ab" },
    { label: "Inicia con 'a' y termina en 'b'", alfa: "a, b", reg: "a(a|b)*b" },
    { label: "Penúltimo símbolo es 1", alfa: "0, 1", reg: "(0|1)*1(0|1)" },
    { label: "Cerradura de Kleene simple (a|b)*", alfa: "a, b", reg: "(a|b)*" },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorLocal(null);
    try {
      onProcesar(alfabetoInput, regexInput);
    } catch (err: any) {
      setErrorLocal(err.message || String(err));
    }
  };

  const cargarEjemplo = (alfa: string, reg: string) => {
    setAlfabetoInput(alfa);
    setRegexInput(reg);
    setErrorLocal(null);
    onProcesar(alfa, reg);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Modalidad A: Desde Expresión Regular (Thompson ➔ Subconjuntos ➔ Minimización)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingresa los símbolos de Σ y la expresión regular para generar la transformación completa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            RF-01: Alfabeto Σ (Separado por comas)
          </label>
          <input
            type="text"
            value={alfabetoInput}
            onChange={(e) => setAlfabetoInput(e.target.value)}
            placeholder="Ej: a, b"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            No admite duplicados ni el metasímbolo 'ε'.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            RF-02: Expresión Regular
          </label>
          <input
            type="text"
            value={regexInput}
            onChange={(e) => setRegexInput(e.target.value)}
            placeholder="Ej: (a|b)*ab"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Operadores permitidos: | (unión), * (cerradura Kleene), ( ) paréntesis.
          </span>
        </div>
      </div>

      {errorLocal && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorLocal}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Ejemplos:
          </span>
          {ejemplos.map((ej, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => cargarEjemplo(ej.alfa, ej.reg)}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors border border-slate-700"
            >
              {ej.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md transition-all shrink-0"
        >
          <PlayCircle className="w-4 h-4" /> Procesar Modalidad A
        </button>
      </div>
    </form>
  );
};
