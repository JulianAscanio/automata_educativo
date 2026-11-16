import React from "react";
import { PedagogicalTracer } from "../core/Tracer";
import { ArrowRight, Layers, AlertCircle, Info } from "lucide-react";

interface EducationalTraceProps {
  tracer: PedagogicalTracer;
}

export const EducationalTrace: React.FC<EducationalTraceProps> = ({ tracer }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-slate-200">{tracer.titulo}</span>
        <span className="font-mono text-slate-500">
          {tracer.registros.length} pasos
        </span>
      </div>

      <div className="space-y-2 custom-scrollbar max-h-[380px] overflow-y-auto pr-1">
        {tracer.registros.map((reg, idx) => {
          if (reg.tipo === "ETAPA") {
            return (
              <div
                key={idx}
                className="mt-3 first:mt-0 font-semibold text-xs text-indigo-300 bg-indigo-950/30 border-l-2 border-indigo-500 py-1.5 px-3 rounded-r-lg flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>{reg.mensaje}</span>
              </div>
            );
          }

          if (reg.tipo === "MAPEO") {
            return (
              <div
                key={idx}
                className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs font-mono flex items-center gap-2 text-slate-200"
              >
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{reg.mensaje}</span>
              </div>
            );
          }

          if (reg.tipo === "PARTICION") {
            return (
              <div
                key={idx}
                className="p-2 rounded-lg bg-sky-950/20 border border-sky-800/40 text-xs font-mono text-sky-200"
              >
                <span>{reg.mensaje}</span>
              </div>
            );
          }

          if (reg.tipo === "ADVERTENCIA") {
            return (
              <div
                key={idx}
                className="p-2 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs font-mono text-amber-300 flex items-center gap-2"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{reg.mensaje}</span>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="text-xs text-slate-300 font-mono pl-3 border-l border-slate-800 py-0.5 flex items-start gap-1.5"
            >
              <Info className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
              <span>{reg.mensaje}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
