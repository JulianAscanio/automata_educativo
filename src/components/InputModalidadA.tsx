import React, { useState } from "react";
import { Play, AlertCircle } from "lucide-react";

interface InputModalidadAProps {
  onProcesar: (alfabetoStr: string, regexStr: string) => void;
}

export const InputModalidadA: React.FC<InputModalidadAProps> = ({ onProcesar }) => {
  const [alfabetoInput, setAlfabetoInput] = useState<string>("a, b");
  const [regexInput, setRegexInput] = useState<string>("(a|b)*ab");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const ejemplos = [
    { label: "(a|b)*ab", alfa: "a, b", reg: "(a|b)*ab", hint: "Termina en ab" },
    { label: "a(a|b)*b", alfa: "a, b", reg: "a(a|b)*b", hint: "Inicia en a, termina en b" },
    { label: "(0|1)*1(0|1)", alfa: "0, 1", reg: "(0|1)*1(0|1)", hint: "Penúltimo es 1" },
    { label: "(a|b)*", alfa: "a, b", reg: "(a|b)*", hint: "Cualquier combinación" },
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
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Alfabeto (Σ)
          </label>
          <input
            type="text"
            value={alfabetoInput}
            onChange={(e) => setAlfabetoInput(e.target.value)}
            placeholder="a, b"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="md:col-span-7">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Expresión regular{" "}
            <span className="text-slate-500 font-normal">
              — usa <code className="text-slate-400">|</code> unión,{" "}
              <code className="text-slate-400">*</code> cerradura,{" "}
              <code className="text-slate-400">( )</code> agrupar
            </span>
          </label>
          <input
            type="text"
            value={regexInput}
            onChange={(e) => setRegexInput(e.target.value)}
            placeholder="(a|b)*ab"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Generar
          </button>
        </div>
      </div>

      {errorLocal && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/70 text-rose-300 rounded-xl text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorLocal}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
        <span className="text-slate-500">Ejemplos:</span>
        {ejemplos.map((ej, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => cargarEjemplo(ej.alfa, ej.reg)}
            title={ej.hint}
            className="px-2.5 py-1 bg-slate-950/70 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono transition-colors border border-slate-800"
          >
            {ej.label}
          </button>
        ))}
      </div>
    </form>
  );
};
