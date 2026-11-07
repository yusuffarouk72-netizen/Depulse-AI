import React, { useMemo, useState } from 'react';
import { TensionPoint } from '../../types/movie';
import { Activity, Flame, Zap, ArrowUpRight, Clock } from 'lucide-react';

interface CinematicTensionGraphProps {
  tensionPoints: TensionPoint[];
  durationSeconds: number;
  currentTime: number;
  onSeek: (seconds: number) => void;
}

export const CinematicTensionGraph: React.FC<CinematicTensionGraphProps> = ({
  tensionPoints,
  durationSeconds,
  currentTime,
  onSeek,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TensionPoint | null>(null);

  const effectiveDuration = durationSeconds > 0 ? durationSeconds : 150;
  const width = 800;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const pointsWithCoords = useMemo(() => {
    if (!tensionPoints || tensionPoints.length === 0) return [];
    return tensionPoints.map((p) => {
      const x = paddingX + (p.timestampSeconds / effectiveDuration) * (width - paddingX * 2);
      const y = height - paddingY - (p.tensionLevel / 100) * (height - paddingY * 2);
      return { ...p, x, y };
    });
  }, [tensionPoints, effectiveDuration, width, height, paddingX, paddingY]);

  const tensionPath = useMemo(() => {
    if (pointsWithCoords.length < 2) return '';
    return pointsWithCoords.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      const prev = pointsWithCoords[i - 1];
      const cx1 = prev.x + (point.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (point.x - prev.x) / 2;
      const cy2 = point.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${point.x} ${point.y}`;
    }, '');
  }, [pointsWithCoords]);

  const tensionArea = useMemo(() => {
    if (pointsWithCoords.length < 2) return '';
    const first = pointsWithCoords[0];
    const last = pointsWithCoords[pointsWithCoords.length - 1];
    const bottomY = height - paddingY;
    return `${tensionPath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [tensionPath, pointsWithCoords, height, paddingY]);

  const currentHeadX =
    paddingX + Math.min(1, Math.max(0, currentTime / effectiveDuration)) * (width - paddingX * 2);

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-100">
              Cinematic Tension & Pacing Arc
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              Timeline Synced
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual map of narrative stakes, musical crescendos, and dramatic dialogue velocity.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span>Dramatic Tension (0-100)</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full aspect-[22/6] min-h-[160px] select-none my-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible cursor-crosshair"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            onSeek(fraction * effectiveDuration);
          }}
        >
          <defs>
            <linearGradient id="tensionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#881337" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            <filter id="tensionGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f43f5e" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[100, 75, 50, 25, 0].map((val) => {
            const y = height - paddingY - (val / 100) * (height - paddingY * 2);
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {tensionArea && <path d={tensionArea} fill="url(#tensionFill)" />}

          {/* Line curve */}
          {tensionPath && (
            <path
              d={tensionPath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              filter="url(#tensionGlow)"
              strokeLinecap="round"
            />
          )}

          {/* Data Points */}
          {pointsWithCoords.map((pt, i) => (
            <g
              key={i}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(pt.timestampSeconds);
              }}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#f43f5e"
                stroke="#0f172a"
                strokeWidth="2"
                className="transition-transform group-hover:scale-150"
              />
            </g>
          ))}

          {/* Playhead Scrubber */}
          <line
            x1={currentHeadX}
            y1={paddingY - 10}
            x2={currentHeadX}
            y2={height - paddingY + 4}
            stroke="#ffffff"
            strokeWidth="2"
            filter="drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))"
          />
          <polygon
            points={`${currentHeadX - 4},${paddingY - 10} ${currentHeadX + 4},${paddingY - 10} ${currentHeadX},${paddingY - 3}`}
            fill="#ffffff"
          />

          {/* X marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const s = Math.round(pct * effectiveDuration);
            const x = paddingX + pct * (width - paddingX * 2);
            return (
              <text
                key={pct}
                x={x}
                y={height - 6}
                textAnchor="middle"
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
              >
                {formatSecs(s)}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 border border-slate-700 rounded-xl p-2.5 shadow-2xl text-xs w-56 backdrop-blur-md"
            style={{
              left: `${(hoveredPoint.timestampSeconds / effectiveDuration) * 100}%`,
              top: '30%',
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
              <span className="font-mono font-bold text-rose-400">
                {hoveredPoint.timeFormatted}
              </span>
              <span className="font-semibold text-white">
                Tension: {hoveredPoint.tensionLevel}/100
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mb-1">
              {hoveredPoint.eventDescription}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Mood: {hoveredPoint.mood}</span>
              <span>{hoveredPoint.pacingWpm} WPM</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
