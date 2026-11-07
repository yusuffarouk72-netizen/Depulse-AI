import React, { useState } from 'react';
import { CoachingCardData } from '../types/sales';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Quote,
  Lightbulb,
  Copy,
  Check,
  TrendingUp,
  Target,
  ShieldAlert,
  Award,
  ChevronRight,
} from 'lucide-react';

interface CoachingCardProps {
  coachingCard: CoachingCardData;
  onSeek: (seconds: number) => void;
}

export const CoachingCard: React.FC<CoachingCardProps> = ({ coachingCard, onSeek }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyScript = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getProjectionBadge = (projection: string) => {
    switch (projection) {
      case 'Highly Likely to Close':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Highly Likely to Close
          </span>
        );
      case 'High Risk of Churn/Drop':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            High Risk of Churn/Drop
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs Follow-Up
          </span>
        );
    }
  };

  const { thingsDoneWell = [], missedOpportunities = [] } = coachingCard;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Projection Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              AI Sales Coaching Intelligence Card
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Gong & Challenger Calibrated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Executive deal synthesis, tactical leverage moments, and turn-by-turn script coaching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
              Deal Projection
            </span>
          </div>
          {getProjectionBadge(coachingCard.dealOutcomeProjection)}
        </div>
      </div>

      {/* Executive Call Brief Box */}
      <div className="my-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col md:flex-row items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
          <Target className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Executive Call Brief
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
              Stage: {coachingCard.dealStage}
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {coachingCard.executiveSummary}
          </p>
          {coachingCard.primaryBuyerPain && (
            <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-300/90 bg-amber-950/30 border border-amber-500/20 px-3 py-1.5 rounded-lg">
              <span className="font-semibold text-amber-400 shrink-0">Primary Buyer Pain:</span>
              <span className="truncate">{coachingCard.primaryBuyerPain}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: 3 Things Done Well vs 3 Missed Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* COLUMN 1: 3 THINGS DONE WELL */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-950/80">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                3 Things You Did Well
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              High Leverage
            </span>
          </div>

          <div className="space-y-3.5">
            {thingsDoneWell.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-slate-950/80 border border-emerald-900/30 hover:border-emerald-700/50 rounded-xl p-4 transition-all duration-200 group relative"
              >
                {/* Index & Badge */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                      {item.scoreContribution || '+12 pts'}
                    </span>
                    <button
                      onClick={() => onSeek(item.timestampSeconds)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-800/50 transition-colors"
                      title="Jump to audio timestamp"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {item.timestamp}
                    </button>
                  </div>
                </div>

                {/* Verbatim Rep Quote */}
                <div className="my-2.5 pl-3 border-l-2 border-emerald-500/50 text-xs italic text-slate-300 bg-emerald-950/10 py-1.5 pr-2 rounded-r-md">
                  "{item.quote}"
                </div>

                {/* Impact Rationale */}
                <p className="text-xs text-slate-400 leading-normal mb-2.5">
                  {item.impactReason}
                </p>

                {/* Sales Methodology Tag */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <Award className="w-3.5 h-3.5" />
                    {item.salesPrinciple}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2: 3 MISSED OPPORTUNITIES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-rose-950/80">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wide">
                3 Missed Opportunities
              </h3>
            </div>
            <span className="text-xs font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
              Coaching Action Plan
            </span>
          </div>

          <div className="space-y-3.5">
            {missedOpportunities.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-slate-950/80 border border-rose-900/30 hover:border-rose-700/50 rounded-xl p-4 transition-all duration-200 group relative"
              >
                {/* Index & Badge */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold font-mono flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-100 group-hover:text-rose-300 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        item.dealRisk === 'High'
                          ? 'bg-rose-950/70 text-rose-300 border-rose-700/60'
                          : 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                      }`}
                    >
                      {item.dealRisk || 'Medium'} Risk
                    </span>
                    <button
                      onClick={() => onSeek(item.timestampSeconds)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/50 transition-colors"
                      title="Jump to audio timestamp"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {item.timestamp}
                    </button>
                  </div>
                </div>

                {/* What happened */}
                <p className="text-xs text-slate-400 leading-normal mb-2.5">
                  <span className="font-semibold text-slate-300">Observation: </span>
                  {item.whatWentWrong}
                </p>

                {/* Actionable Script Recommendation Box */}
                <div className="mt-2.5 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 relative">
                  <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-indigo-300">
                    <span className="flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      Recommended Turnaround Script:
                    </span>
                    <button
                      onClick={() => handleCopyScript(item.id, item.recommendedAlternative)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/80 hover:bg-indigo-600 text-[10px] text-slate-300 hover:text-white transition-colors"
                      title="Copy script"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-indigo-100 italic font-medium leading-relaxed">
                    {item.recommendedAlternative}
                  </p>
                </div>

                {/* Sales Methodology Guardrail */}
                <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-slate-400 italic">{item.frameworkAdvice}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
