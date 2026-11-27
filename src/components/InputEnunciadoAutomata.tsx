import { useState } from "react";
import { Play } from "lucide-react";
import { ejemploAutomata } from "../algorithms/automataProblem";

interface Props {
  onProcesar: (enunciado: string) => void;
  onEditar: () => void;
}

export function InputEnunciadoAutomata({ onProcesar, onEditar }: Props) {
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
        <label htmlFor="enunciado-automata" className="block text-sm font-medium text-slate-100">
          Enunciado del autómata
        </label>
        <p id="ayuda-automata" className="text-xs text-slate-400">
          Describe el estado inicial, los finales y las transiciones. Si hay símbolos que no aparecen en las transiciones, indícalos en el enunciado con «alfabeto {"{0, 1}"}».
        </p>
        <textarea
          id="enunciado-automata"
          aria-describedby="ayuda-automata"
          rows={4}
          maxLength={1500}
          required
          value={enunciado}
          onChange={(event) => {
            setEnunciado(event.target.value);
            onEditar();
          }}
          placeholder={ejemploAutomata}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setEnunciado(ejemploAutomata);
            onProcesar(ejemploAutomata);
          }}
          className="px-2.5 py-1 bg-slate-950/70 hover:bg-slate-800 text-slate-300 rounded-lg text-xs border border-slate-800"
        >
          Ejemplo AFND con ε
        </button>
        <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium">
          <Play className="w-3.5 h-3.5 fill-current" /> Analizar y minimizar
        </button>
      </div>
    </form>
  );
}
