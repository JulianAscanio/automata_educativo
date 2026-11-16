import React from "react";
import { ClasificacionResultado } from "../algorithms/classifier";
import { TipoAutomata } from "../core/types";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface ClassificationCardProps {
  resultado: ClasificacionResultado;
}

export const ClassificationCard: React.FC<ClassificationCardProps> = ({ resultado }) => {
  const esAFD = resultado.tipo === TipoAutomata.AFD;
  const esEpsilon = resultado.tipo === TipoAutomata.AFND_EPSILON;

  return (
    <div
      className={`p-4 rounded-xl border text-xs ${
        esAFD
          ? "bg-emerald-950/20 border-emerald-800/50 text-emerald-200"
          : esEpsilon
          ? "bg-amber-950/20 border-amber-800/50 text-amber-200"
          : "bg-indigo-950/20 border-indigo-800/50 text-indigo-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {esAFD ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">
              Autómata inicial detectado: {resultado.tipo}
            </span>
          </div>

          <div className="space-y-1 text-slate-300 font-mono">
            {resultado.razones.map((r, idx) => (
              <p key={idx} className="leading-relaxed">
                {r}
              </p>
            ))}
          </div>

          <p className="text-slate-400 pt-1">
            {esAFD
              ? "Ya es determinista, por lo que pasa directo a minimización."
              : "Requiere determinización por subconjuntos antes de minimizar."}
          </p>
        </div>
      </div>
    </div>
  );
};
