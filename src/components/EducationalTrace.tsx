import React from "react";
import { PedagogicalTracer } from "../core/Tracer";
import { BookOpen, ArrowRight, Layers, AlertCircle, Info } from "lucide-react";

interface EducationalTraceProps {
  tracer: PedagogicalTracer;
}

export const EducationalTrace: React.FC<EducationalTraceProps> = ({ tracer }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-slate-200 text-sm">{tracer.titulo}</h3>
        <span className="ml-auto text-xs font-mono text-slate-500">
          {tracer.registros.length} eventos registrados (RF-10 / RF-13)
        </span>
      </div>

      <div className="space-y-3 custom-scrollbar max-h-96 overflow-y-auto pr-2">
        {tracer.registros.map((reg, idx) => {
          if (reg.tipo === "ETAPA") {
            return (
              <div
                key={idx}
                className="mt-4 first:mt-0 font-bold text-xs uppercase tracking-wider text-indigo-300 bg-indigo-950/40 border-l-4 border-indigo-500 py-1.5 px-3 rounded-r flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{reg.mensaje}</span>
              </div>
            );
          }

          if (reg.tipo === "MAPEO") {
            return (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-mono flex items-center justify-between text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{reg.mensaje}</span>
                </div>
              </div>
            );
          }

          if (reg.tipo === "PARTICION") {
            return (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-800/50 text-xs font-mono text-sky-200"
              >
                <span>{reg.mensaje}</span>
              </div>
            );
          }

          if (reg.tipo === "ADVERTENCIA") {
            return (
              <div
                key={idx}
                className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs font-mono text-amber-300 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reg.mensaje}</span>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="text-xs text-slate-300 font-mono pl-4 border-l border-slate-800 py-0.5 flex items-start gap-1.5"
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
