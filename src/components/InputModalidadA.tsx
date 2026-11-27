import React, { useState } from "react";
import { Play } from "lucide-react";
import { ejemplosEnunciados } from "../algorithms/languageProblem";

interface InputModalidadAProps {
  onProcesar: (enunciado: string) => void;
  onEditar: () => void;
}

export const InputModalidadA: React.FC<InputModalidadAProps> = ({ onProcesar, onEditar }) => {
  const [enunciado, setEnunciado] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onProcesar(enunciado);
      }}
      className="p-4 sm:p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-4"
    >
      <div className="space-y-2">
        <label htmlFor="enunciado" className="block text-sm font-medium text-slate-100">
          Enunciado del problema
        </label>
        <p id="ayuda-enunciado" className="text-xs text-slate-400">
          Escribe el problema en lenguaje natural. El sistema extrae automáticamente el alfabeto, la expresión regular, el AFND, la determinización y el AFD mínimo.
        </p>
        <textarea
          id="enunciado"
          aria-describedby="ayuda-enunciado"
          rows={3}
          maxLength={400}
          required
          value={enunciado}
          onChange={(event) => {
            setEnunciado(event.target.value);
            onEditar();
          }}
          placeholder={ejemplosEnunciados[0].texto}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Ejemplos</span>
          {ejemplosEnunciados.map(({ titulo, texto }) => (
            <button
              key={titulo}
              type="button"
              onClick={() => {
                setEnunciado(texto);
                onProcesar(texto);
              }}
              className="px-2.5 py-1 bg-slate-950/70 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-800"
            >
              {titulo}
            </button>
          ))}
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Resolver problema
        </button>
      </div>
    </form>
  );
};
