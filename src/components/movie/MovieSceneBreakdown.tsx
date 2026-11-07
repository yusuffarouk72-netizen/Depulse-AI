import React from 'react';
import { MovieScene } from '../../types/movie';
import { Clapperboard, Play, Users, SunMedium, MessageSquareQuote } from 'lucide-react';

interface MovieSceneBreakdownProps {
  scenes: MovieScene[];
  currentTime: number;
  onSeek: (seconds: number) => void;
}

export const MovieSceneBreakdown: React.FC<MovieSceneBreakdownProps> = ({
  scenes,
  currentTime,
  onSeek,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clapperboard className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold text-slate-100">
            Scene-by-Scene Narrative Breakdown
          </h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
          {scenes.length} Scenes Identified
        </span>
      </div>

      <div className="space-y-3">
        {scenes.map((scene) => {
          const isActive =
            currentTime >= scene.startSeconds && currentTime <= scene.endSeconds;

          return (
            <div
              key={scene.id}
              onClick={() => onSeek(scene.startSeconds)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/40'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-indigo-600/20 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center border border-indigo-500/30">
                    {scene.sceneNumber}
                  </span>
                  <h4 className="text-sm font-bold text-white hover:text-indigo-300 transition-colors">
                    {scene.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {scene.mood}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    {scene.startTime}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3 pl-8">
                {scene.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8 pt-2 border-t border-slate-900 text-xs">
                {scene.dominantCharacters?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">
                      Characters: <strong className="text-slate-200">{scene.dominantCharacters.join(', ')}</strong>
                    </span>
                  </div>
                )}

                {scene.lightingAndAtmosphere && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <SunMedium className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate" title={scene.lightingAndAtmosphere}>
                      Lighting: <strong className="text-slate-200">{scene.lightingAndAtmosphere}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
