import React from 'react';
import { CallScorecard } from '../types/sales';
import {
  PieChart,
  Clock,
  HelpCircle,
  TrendingUp,
  Flame,
  CheckCircle2,
  XCircle,
  Zap,
  Gauge,
} from 'lucide-react';

interface ScorecardMetricsProps {
  scorecard: CallScorecard;
}

export const ScorecardMetrics: React.FC<ScorecardMetricsProps> = ({ scorecard }) => {
  const {
    overallScore = 80,
    talkRatioRep = 43,
    talkRatioProspect = 57,
    longestMonologueSecondsRep = 42,
    questionsAskedRep = 6,
    buyingSignalsDetected = 4,
    nextStepsAgreed = true,
    nextStepSummary = '',
    pacingWpm = 140,
  } = scorecard;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Overall Deal Score */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Call Quality Score</span>
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div className="my-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {overallScore}
          </span>
          <span className="text-xs text-slate-500 font-mono">/ 100</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              overallScore >= 80 ? 'bg-emerald-400' : overallScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'
            }`}
          />
          <span className="text-slate-300 font-medium">
            {overallScore >= 85 ? 'Top Performer' : overallScore >= 70 ? 'Proficient' : 'Needs Practice'}
          </span>
        </div>
      </div>

      {/* 2. Talk-to-Listen Ratio */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Talk : Listen</span>
          <PieChart className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="my-1.5">
          <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
            <span className="text-indigo-400">Rep {talkRatioRep}%</span>
            <span className="text-amber-400">Buyer {talkRatioProspect}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="bg-indigo-500 h-full" style={{ width: `${talkRatioRep}%` }} />
            <div className="bg-amber-500 h-full" style={{ width: `${talkRatioProspect}%` }} />
          </div>
        </div>
        <span className="text-[10px] text-slate-400 truncate" title="Ideal benchmark is 43% Rep / 57% Buyer">
          Target: 43% Rep / 57% Buyer
        </span>
      </div>

      {/* 3. Longest Monologue */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Longest Monologue</span>
          <Clock className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="my-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-white font-mono">
            {longestMonologueSecondsRep}s
          </span>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              longestMonologueSecondsRep <= 60
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {longestMonologueSecondsRep <= 60 ? 'Optimal' : '> 60s limit'}
          </span>
        </div>
        <span className="text-[10px] text-slate-400">Under 60s benchmark</span>
      </div>

      {/* 4. Questions Asked */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Discovery Questions</span>
          <HelpCircle className="w-4 h-4 text-purple-400" />
        </div>
        <div className="my-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-purple-300 font-mono">
            {questionsAskedRep}
          </span>
          <span className="text-xs text-slate-400">inquiries</span>
        </div>
        <span className="text-[10px] text-slate-400">Target: 5-8 per demo</span>
      </div>

      {/* 5. Buying Signals Detected */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Buying Signals</span>
          <Flame className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="my-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-emerald-400 font-mono">
            {buyingSignalsDetected}
          </span>
          <span className="text-xs text-slate-400">signals</span>
        </div>
        <span className="text-[10px] text-emerald-400/90 font-medium truncate">
          Tech fit & Timeline validated
        </span>
      </div>

      {/* 6. Next Steps Clear */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Next Steps Agreed</span>
          {nextStepsAgreed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400" />
          )}
        </div>
        <div className="my-2">
          <span
            className={`text-sm font-bold block truncate ${
              nextStepsAgreed ? 'text-emerald-300' : 'text-rose-300'
            }`}
            title={nextStepSummary || 'Confirmed before hanging up'}
          >
            {nextStepsAgreed ? 'Committed' : 'Unconfirmed'}
          </span>
        </div>
        <span
          className="text-[10px] text-slate-400 truncate block"
          title={nextStepSummary || 'Follow up agreed'}
        >
          {nextStepSummary || 'Explicit close date set'}
        </span>
      </div>
    </div>
  );
};
