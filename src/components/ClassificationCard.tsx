import React from "react";
import { ClasificacionResultado } from "../algorithms/classifier";
import { TipoAutomata } from "../core/types";
import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

interface ClassificationCardProps {
  resultado: ClasificacionResultado;
}

export const ClassificationCard: React.FC<ClassificationCardProps> = ({ resultado }) => {
  const esAFD = resultado.tipo === TipoAutomata.AFD;
  const esEpsilon = resultado.tipo === TipoAutomata.AFND_EPSILON;

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        esAFD
          ? "bg-emerald-950/20 border-emerald-800/60 text-emerald-200"
          : esEpsilon
          ? "bg-amber-950/20 border-amber-800/60 text-amber-200"
          : "bg-indigo-950/20 border-indigo-800/60 text-indigo-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {esAFD ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              RF-05: Verificador de Determinismo
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                esAFD
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {resultado.tipo}
            </span>
          </div>

          <div className="mt-2.5 space-y-1 text-xs text-slate-300">
            {resultado.razones.map((r, idx) => (
              <p key={idx} className="font-mono leading-relaxed">
                {r}
              </p>
            ))}
          </div>

          <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>
              {esAFD
                ? "Ruta: Al ser AFD puro, se omite el algoritmo de subconjuntos y se procede directamente a la minimización."
                : "Ruta: Requiere determinización formal mediante el Algoritmo de Subconjuntos con clausura épsilon (RF-06)."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
