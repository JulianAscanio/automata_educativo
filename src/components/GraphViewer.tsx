import React, { useState, useEffect } from "react";
import { Automata } from "../core/Automata";

interface GraphViewerProps {
  automata: Automata;
  estadoActivo?: string;
}

interface NodePos {
  x: number;
  y: number;
}

export const GraphViewer: React.FC<GraphViewerProps> = ({ automata, estadoActivo }) => {
  const [positions, setPositions] = useState<Record<string, NodePos>>({});
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const estados = automata.obtenerListaEstados();
  const transiciones = automata.obtenerTodasLasTransiciones();

  // Calcular posiciones en círculo por defecto al cambiar de autómata
  useEffect(() => {
    const total = estados.length;
    if (total === 0) return;

    const width = 650;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.72;

    const newPos: Record<string, NodePos> = {};
    estados.forEach((e, i) => {
      const angle = (2 * Math.PI * i) / total - Math.PI / 2;
      newPos[e.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
    setPositions(newPos);
  }, [automata]);

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    setDraggingNode(id);
    const pos = positions[id] || { x: 0, y: 0 };
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode) return;
    setPositions((prev) => ({
      ...prev,
      [draggingNode]: {
        x: Math.max(40, Math.min(610, e.clientX - dragOffset.x)),
        y: Math.max(40, Math.min(360, e.clientY - dragOffset.y)),
      },
    }));
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  // Agrupar transiciones con mismo origen y destino para mostrar múltiples símbolos (ej: "a, b")
  const transicionesAgrupadas: Array<{
    origen: string;
    destino: string;
    simbolos: string[];
  }> = [];

  const mapaEdges = new Map<string, string[]>();
  transiciones.forEach((t) => {
    const key = `${t.origen}->${t.destino}`;
    if (!mapaEdges.has(key)) {
      mapaEdges.set(key, []);
    }
    mapaEdges.get(key)!.push(t.simbolo);
  });

  mapaEdges.forEach((simbs, key) => {
    const [origen, destino] = key.split("->");
    transicionesAgrupadas.push({
      origen,
      destino,
      simbolos: Array.from(new Set(simbs)).sort(),
    });
  });

  return (
    <div
      className="relative w-full h-[460px] sm:h-[500px] bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="absolute top-3 left-4 z-10 flex items-center gap-3 flex-wrap right-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-indigo-400 inline-block"></span> Estado normal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-emerald-400 bg-emerald-500/20 inline-block ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900"></span> Final (F)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 border-t-2 border-r-2 border-indigo-400 rotate-45 inline-block"></span> Inicial (q0)
        </span>
        <span className="text-slate-500">| Arrastra los nodos para ordenarlos</span>
      </div>

      <svg className="w-full h-full">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="9"
            markerHeight="7"
            refX="8"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 9 3.5, 0 7" fill="#818cf8" />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="9"
            markerHeight="7"
            refX="8"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 9 3.5, 0 7" fill="#38bdf8" />
          </marker>
        </defs>

        {/* Dibujar Aristas (Transiciones) */}
        {transicionesAgrupadas.map((edge, idx) => {
          const posOrig = positions[edge.origen];
          const posDest = positions[edge.destino];
          if (!posOrig || !posDest) return null;

          const label = edge.simbolos.join(", ");
          const esSelfLoop = edge.origen === edge.destino;

          if (esSelfLoop) {
            // Loop sobre sí mismo
            const r = 26;
            const loopX = posOrig.x;
            const loopY = posOrig.y - r;
            return (
              <g key={`edge-${idx}`}>
                <path
                  d={`M ${posOrig.x - 12} ${posOrig.y - 20} C ${posOrig.x - 30} ${posOrig.y - 65}, ${posOrig.x + 30} ${posOrig.y - 65}, ${posOrig.x + 12} ${posOrig.y - 20}`}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.8"
                  markerEnd="url(#arrowhead)"
                />
                <rect
                  x={loopX - 16}
                  y={loopY - 44}
                  width="32"
                  height="16"
                  rx="4"
                  fill="#0f172a"
                  className="stroke-slate-700 stroke-1"
                />
                <text
                  x={loopX}
                  y={loopY - 32}
                  textAnchor="middle"
                  fill="#c7d2fe"
                  fontSize="13"
                  fontWeight="bold"
                >
                  {label}
                </text>
              </g>
            );
          }

          // Verificar si existe la arista opuesta para arquear la curva
          const hayOpuesta = transicionesAgrupadas.some(
            (o) => o.origen === edge.destino && o.destino === edge.origen
          );

          const dx = posDest.x - posOrig.x;
          const dy = posDest.y - posOrig.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nodeRadius = 24;

          const offsetX = (dx / dist) * nodeRadius;
          const offsetY = (dy / dist) * nodeRadius;

          const startX = posOrig.x + offsetX;
          const startY = posOrig.y + offsetY;
          const endX = posDest.x - offsetX;
          const endY = posDest.y - offsetY;

          let pathD = "";
          let labelX = (startX + endX) / 2;
          let labelY = (startY + endY) / 2;

          if (hayOpuesta) {
            // Arco curvado para evitar superposición
            const curvo = 32;
            const normX = -dy / dist;
            const normY = dx / dist;
            const midX = (startX + endX) / 2 + normX * curvo;
            const midY = (startY + endY) / 2 + normY * curvo;
            pathD = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
            labelX = midX;
            labelY = midY;
          } else {
            pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
          }

          return (
            <g key={`edge-${idx}`}>
              <path
                d={pathD}
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.8"
                markerEnd="url(#arrowhead)"
              />
              <rect
                x={labelX - 16}
                y={labelY - 10}
                width={Math.max(28, label.length * 8 + 10)}
                height="18"
                rx="4"
                fill="#0f172a"
                className="stroke-slate-700 stroke-1"
              />
              <text
                x={labelX}
                y={labelY + 3}
                textAnchor="middle"
                fill="#c7d2fe"
                fontSize="13"
                fontWeight="bold"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Dibujar Nodos (Estados) */}
        {estados.map((est) => {
          const pos = positions[est.id] || { x: 100, y: 100 };
          const esActivo = estadoActivo === est.id;

          return (
            <g
              key={est.id}
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handleMouseDown(est.id, e)}
            >
              <title>
                {est.subEstados?.length
                  ? `${est.id}: {${est.subEstados.join(", ")}}`
                  : est.id}
              </title>
              {/* Flecha indicadora de estado inicial */}
              {est.esInicial && (
                <g>
                  <line
                    x1={pos.x - 52}
                    y1={pos.y}
                    x2={pos.x - 28}
                    y2={pos.y}
                    stroke="#818cf8"
                    strokeWidth="2.5"
                    markerEnd="url(#arrowhead)"
                  />
                  <text
                    x={pos.x - 56}
                    y={pos.y + 4}
                    textAnchor="end"
                    fill="#a5b4fc"
                    fontSize="10"
                    fontWeight="600"
                  >
                    inicio
                  </text>
                </g>
              )}

              {/* Halo de estado activo (durante simulación) */}
              {esActivo && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="32"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  className="animate-pulse"
                />
              )}

              {/* Círculo exterior (Doble círculo para estados finales) */}
              {est.esFinal && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="27"
                  fill="none"
                  stroke={esActivo ? "#38bdf8" : "#34d399"}
                  strokeWidth="2"
                />
              )}

              {/* Círculo principal del estado */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="22"
                fill={
                  esActivo
                    ? "#0284c7"
                    : est.esFinal
                    ? "#064e3b"
                    : est.esInicial
                    ? "#312e81"
                    : "#1e293b"
                }
                stroke={
                  esActivo
                    ? "#38bdf8"
                    : est.esFinal
                    ? "#10b981"
                    : est.esInicial
                    ? "#818cf8"
                    : "#475569"
                }
                strokeWidth="2.5"
                className="transition-colors duration-150 shadow-lg"
              />

              {/* Etiqueta del ID del estado */}
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize={est.id.length > 5 ? "10" : "12"}
                fontWeight="bold"
                pointerEvents="none"
              >
                {est.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
