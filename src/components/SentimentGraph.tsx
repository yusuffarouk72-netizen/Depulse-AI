import React, { useState, useMemo } from 'react';
import { SentimentPoint } from '../types/sales';
import {
  TrendingUp,
  AlertCircle,
  Sparkles,
  Info,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface SentimentGraphProps {
  sentimentPoints: SentimentPoint[];
  durationSeconds: number;
  currentTime: number;
  onSeek: (seconds: number) => void;
}

export const SentimentGraph: React.FC<SentimentGraphProps> = ({
  sentimentPoints,
  durationSeconds,
  currentTime,
  onSeek,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<SentimentPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [showRepCurve, setShowRepCurve] = useState(true);

  // Compute key metrics
  const stats = useMemo(() => {
    if (!sentimentPoints || sentimentPoints.length === 0) {
      return { avgEngagement: 75, peakEngagement: 90, lowestEngagement: 50, trend: '+25%' };
    }
    const engagements = sentimentPoints.map((p) => p.prospectEngagement);
    const avg = Math.round(engagements.reduce((a, b) => a + b, 0) / engagements.length);
    const maxPoint = sentimentPoints.reduce((prev, curr) =>
      curr.prospectEngagement > prev.prospectEngagement ? curr : prev
    );
    const minPoint = sentimentPoints.reduce((prev, curr) =>
      curr.prospectEngagement < prev.prospectEngagement ? curr : prev
    );

    const first = sentimentPoints[0]?.prospectEngagement || 50;
    const last = sentimentPoints[sentimentPoints.length - 1]?.prospectEngagement || 50;
    const diff = last - first;
    const trend = `${diff >= 0 ? '+' : ''}${diff}%`;

    return {
      avgEngagement: avg,
      peakEngagement: maxPoint.prospectEngagement,
      peakTime: maxPoint.timeFormatted,
      peakMilestone: maxPoint.milestone || 'Value peak',
      lowestEngagement: minPoint.prospectEngagement,
      lowestTime: minPoint.timeFormatted,
      lowestMilestone: minPoint.milestone || 'Objection point',
      trend,
    };
  }, [sentimentPoints]);

  const width = 800;
  const height = 220;
  const paddingX = 40;
  const paddingY = 25;

  const effectiveDuration = durationSeconds > 0 ? durationSeconds : 420;

  // Convert data points to SVG coordinates
  const pointsWithCoords = useMemo(() => {
    if (!sentimentPoints || sentimentPoints.length === 0) return [];
    return sentimentPoints.map((p) => {
      const x = paddingX + (p.timestampSeconds / effectiveDuration) * (width - paddingX * 2);
      // Engagement (0-100) -> SVG Y (height - padding to padding)
      const y = height - paddingY - (p.prospectEngagement / 100) * (height - paddingY * 2);
      // Rep confidence Y
      const repY = height - paddingY - (p.repConfidence / 100) * (height - paddingY * 2);
      return { ...p, x, y, repY };
    });
  }, [sentimentPoints, effectiveDuration, width, height, paddingX, paddingY]);

  // Generate SVG path strings
  const engagementPath = useMemo(() => {
    if (pointsWithCoords.length < 2) return '';
    return pointsWithCoords.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      // Smooth cubic bezier
      const prev = pointsWithCoords[i - 1];
      const cx1 = prev.x + (point.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (point.x - prev.x) / 2;
      const cy2 = point.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${point.x} ${point.y}`;
    }, '');
  }, [pointsWithCoords]);

  const engagementArea = useMemo(() => {
    if (pointsWithCoords.length < 2) return '';
    const first = pointsWithCoords[0];
    const last = pointsWithCoords[pointsWithCoords.length - 1];
    const bottomY = height - paddingY;
    return `${engagementPath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [engagementPath, pointsWithCoords, height, paddingY]);

  const repPath = useMemo(() => {
    if (pointsWithCoords.length < 2) return '';
    return pointsWithCoords.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.repY}`;
      const prev = pointsWithCoords[i - 1];
      const cx1 = prev.x + (point.x - prev.x) / 2;
      const cy1 = prev.repY;
      const cx2 = prev.x + (point.x - prev.x) / 2;
      const cy2 = point.repY;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${point.x} ${point.repY}`;
    }, '');
  }, [pointsWithCoords]);

  // Current playback head line position
  const currentHeadX =
    paddingX + Math.min(1, Math.max(0, currentTime / effectiveDuration)) * (width - paddingX * 2);

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-100">
              Call Engagement & Sentiment Graph
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              Live Duration Synced
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time trajectory of buyer interest, objection resistance, and commitment moments
            over the call duration.
          </p>
        </div>

        {/* Legend & Toggle */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            <span className="text-slate-200 font-medium">Buyer Engagement (0-100)</span>
          </div>
          <button
            onClick={() => setShowRepCurve(!showRepCurve)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors ${
              showRepCurve
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-400'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full border border-indigo-400 ${
                showRepCurve ? 'bg-indigo-400' : 'bg-transparent'
              }`}
            />
            <span>Rep Confidence</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Average Engagement</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-white font-mono">{stats.avgEngagement}%</span>
            <span className="text-[11px] text-emerald-400 font-medium">Healthy</span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Peak Interest</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-cyan-400 font-mono">
              {stats.peakEngagement}%
            </span>
            <span className="text-[11px] text-slate-400 font-mono truncate" title={stats.peakTime}>
              at {stats.peakTime}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Resistance Point</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-amber-400 font-mono">
              {stats.lowestEngagement}%
            </span>
            <span className="text-[11px] text-slate-400 font-mono truncate">
              at {stats.lowestTime}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Sentiment Trajectory</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-emerald-400 font-mono">{stats.trend}</span>
            <span className="text-[11px] text-slate-400 flex items-center">
              Positive close <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            </span>
          </div>
        </div>
      </div>

      {/* SVG Sentiment Graph Area */}
      <div className="relative w-full aspect-[22/8] min-h-[200px] select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible cursor-crosshair"
          onClick={(e) => {
            const svgRect = e.currentTarget.getBoundingClientRect();
            const clickFraction = (e.clientX - svgRect.left) / svgRect.width;
            const targetSeconds = clickFraction * effectiveDuration;
            onSeek(Math.max(0, Math.min(effectiveDuration, targetSeconds)));
          }}
        >
          <defs>
            {/* Gradient for Buyer Engagement Area */}
            <linearGradient id="engagementFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing stroke filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#22d3ee" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Horizontal Grid Zones */}
          {/* 80-100 High Engagement Zone */}
          <rect
            x={paddingX}
            y={paddingY}
            width={width - paddingX * 2}
            height={(height - paddingY * 2) * 0.25}
            fill="#10b981"
            fillOpacity="0.03"
          />
          {/* 50-80 Neutral Discovery Zone */}
          <rect
            x={paddingX}
            y={paddingY + (height - paddingY * 2) * 0.25}
            width={width - paddingX * 2}
            height={(height - paddingY * 2) * 0.45}
            fill="#6366f1"
            fillOpacity="0.02"
          />
          {/* 0-50 Friction Zone */}
          <rect
            x={paddingX}
            y={paddingY + (height - paddingY * 2) * 0.7}
            width={width - paddingX * 2}
            height={(height - paddingY * 2) * 0.3}
            fill="#f43f5e"
            fillOpacity="0.03"
          />

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
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeOpacity="0.5"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Filled Area below Engagement line */}
          {engagementArea && <path d={engagementArea} fill="url(#engagementFill)" />}

          {/* Rep Confidence Line (dashed purple) */}
          {showRepCurve && repPath && (
            <path
              d={repPath}
              fill="none"
              stroke="#818cf8"
              strokeWidth="2"
              strokeDasharray="5 3"
              strokeOpacity="0.8"
            />
          )}

          {/* Main Prospect Engagement Line (cyan glow) */}
          {engagementPath && (
            <path
              d={engagementPath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3"
              filter="url(#glow)"
              strokeLinecap="round"
            />
          )}

          {/* Data Points & Milestone Markers */}
          {pointsWithCoords.map((point, index) => {
            const hasMilestone = Boolean(point.milestone);
            const isNegative = point.sentimentValence < -0.15;
            const isPositive = point.sentimentValence > 0.4;

            return (
              <g
                key={index}
                className="group cursor-pointer"
                onMouseEnter={(e) => {
                  setHoveredPoint(point);
                  const bbox = e.currentTarget.getBoundingClientRect();
                  setHoverCoords({ x: bbox.left + bbox.width / 2, y: bbox.top });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(point.timestampSeconds);
                }}
              >
                {/* Milestone pin stick */}
                {hasMilestone && (
                  <line
                    x1={point.x}
                    y1={point.y}
                    x2={point.x}
                    y2={paddingY - 8}
                    stroke={isNegative ? '#f43f5e' : isPositive ? '#10b981' : '#818cf8'}
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    strokeOpacity="0.7"
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hasMilestone ? 8 : 4}
                  fill={isNegative ? '#f43f5e' : isPositive ? '#10b981' : '#22d3ee'}
                  fillOpacity="0.2"
                  className="transition-transform group-hover:scale-150"
                />

                {/* Core node */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hasMilestone ? 5 : 3}
                  fill={isNegative ? '#f43f5e' : isPositive ? '#10b981' : '#22d3ee'}
                  stroke="#0f172a"
                  strokeWidth="2"
                />

                {/* Milestone label badge above */}
                {hasMilestone && (
                  <g transform={`translate(${point.x}, ${paddingY - 10})`}>
                    <rect
                      x="-42"
                      y="-16"
                      width="84"
                      height="16"
                      rx="4"
                      fill={isNegative ? '#450a0a' : isPositive ? '#064e3b' : '#1e1b4b'}
                      stroke={isNegative ? '#f43f5e' : isPositive ? '#10b981' : '#6366f1'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="-5"
                      textAnchor="middle"
                      fill={isNegative ? '#fca5a5' : isPositive ? '#6ee7b7' : '#c7d2fe'}
                      fontSize="8"
                      fontWeight="600"
                    >
                      {point.milestone && point.milestone.length > 15
                        ? point.milestone.slice(0, 14) + '…'
                        : point.milestone}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Current Playhead Scrubber Line */}
          <line
            x1={currentHeadX}
            y1={paddingY - 12}
            x2={currentHeadX}
            y2={height - paddingY + 6}
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray="none"
            filter="drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))"
          />
          <polygon
            points={`${currentHeadX - 5},${paddingY - 12} ${currentHeadX + 5},${paddingY - 12} ${currentHeadX},${paddingY - 4}`}
            fill="#ffffff"
          />

          {/* X-axis time marks */}
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

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs w-64 backdrop-blur-md"
            style={{
              left: `${(hoveredPoint.timestampSeconds / effectiveDuration) * 100}%`,
              top: '30%',
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="font-mono font-bold text-indigo-400">
                {hoveredPoint.timeFormatted}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  hoveredPoint.sentimentValence > 0.3
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : hoveredPoint.sentimentValence < -0.2
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {hoveredPoint.sentimentValence > 0.3
                  ? 'High Buy Intent'
                  : hoveredPoint.sentimentValence < -0.2
                  ? 'Resistance'
                  : 'Discovery'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Buyer Engagement</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">
                  {hoveredPoint.prospectEngagement}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Rep Confidence</span>
                <span className="text-sm font-bold text-indigo-400 font-mono">
                  {hoveredPoint.repConfidence}%
                </span>
              </div>
            </div>

            {hoveredPoint.milestone && (
              <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-200">
                <span className="font-semibold text-amber-400">Milestone: </span>
                {hoveredPoint.milestone}
              </div>
            )}

            <div className="mt-1.5 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <span>Click to seek audio</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
