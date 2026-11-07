import React from 'react';
import { CharacterDialogueStat } from '../../types/movie';
import { Users, MessageSquare, Award, Sparkles, Mic } from 'lucide-react';

interface CharacterDialogueMetricsProps {
  characters: CharacterDialogueStat[];
}

export const CharacterDialogueMetrics: React.FC<CharacterDialogueMetricsProps> = ({
  characters,
}) => {
  const colors = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Users className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold text-slate-100">
            Character Diarization & Speech Share
          </h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
          {characters.length} Key Roles
        </span>
      </div>

      {/* Aggregate Speech Share Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>Dialogue Share Distribution</span>
          <span className="font-mono text-slate-300">100% Total Spoken</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
          {characters.map((char, idx) => (
            <div
              key={char.characterName}
              style={{
                width: `${char.percentageTalkTime}%`,
                backgroundColor: colors[idx % colors.length],
              }}
              title={`${char.characterName}: ${char.percentageTalkTime}%`}
              className="h-full hover:opacity-80 transition-opacity"
            />
          ))}
        </div>
      </div>

      {/* Character Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {characters.map((char, idx) => {
          const accentColor = colors[idx % colors.length];

          return (
            <div
              key={char.characterName}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <h4 className="text-xs font-bold text-white truncate">
                      {char.characterName}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 truncate block pl-4.5">
                    {char.role}
                  </span>
                </div>

                <span className="text-xs font-bold font-mono text-indigo-400 shrink-0">
                  {char.percentageTalkTime}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                <div>
                  <span className="text-slate-500 block text-[10px]">LINES</span>
                  <span className="text-slate-200 font-bold">{char.lineCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">WORDS</span>
                  <span className="text-slate-200 font-bold">{char.wordCount}</span>
                </div>
              </div>

              {char.emotionalArc && (
                <p className="text-[11px] text-slate-400 leading-normal italic line-clamp-2" title={char.emotionalArc}>
                  "{char.emotionalArc}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
