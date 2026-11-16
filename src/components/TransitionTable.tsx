import React from "react";
import { Automata } from "../core/Automata";

interface TransitionTableProps {
  automata: Automata;
  estadoActivo?: string;
}

export const TransitionTable: React.FC<TransitionTableProps> = ({ automata, estadoActivo }) => {
  const { columnas, filas } = automata.obtenerTablaTransicion();

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-950/60 text-xs text-slate-400 border-b border-slate-800">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Estado
            </th>
            {columnas.map((col) => (
              <th key={col} scope="col" className="px-4 py-2.5 font-medium text-center text-indigo-300 font-mono">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {filas.map(({ estado, celdas }) => {
            const esActivo = estadoActivo === estado.id;
            return (
              <tr
                key={estado.id}
                className={`transition-colors ${
                  esActivo
                    ? "bg-sky-950/60 font-semibold text-sky-200"
                    : "hover:bg-slate-800/40"
                }`}
              >
                <td className="px-4 py-3 flex items-center gap-2">
                  <span className="text-xs font-mono w-6 text-slate-400">
                    {estado.esInicial && "➔ "}
                    {estado.esFinal && "★ "}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
                      estado.esFinal
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                        : estado.esInicial
                        ? "bg-indigo-950/80 text-indigo-300 border border-indigo-800"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {estado.id}
                  </span>
                  {estado.subEstados && estado.subEstados.length > 0 && (
                    <span className="text-xs text-slate-500 font-mono">
                      {"{" + estado.subEstados.join(", ") + "}"}
                    </span>
                  )}
                </td>
                {columnas.map((col) => (
                  <td key={col} className="px-4 py-3 text-center font-mono text-xs">
                    {celdas[col] === "—" ? (
                      <span className="text-slate-600">—</span>
                    ) : (
                      <span className="text-slate-200 font-semibold bg-slate-800/60 px-2 py-1 rounded">
                        {celdas[col]}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
