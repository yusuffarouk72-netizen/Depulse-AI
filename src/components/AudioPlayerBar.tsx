import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  Radio,
} from 'lucide-react';

interface AudioPlayerBarProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  currentSpeakerLabel?: string;
  currentSpeakerRole?: 'rep' | 'prospect';
  callTitle: string;
  hasAudioMedia: boolean;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  playbackRate,
  onChangePlaybackRate,
  currentSpeakerLabel,
  currentSpeakerRole,
  callTitle,
  hasAudioMedia,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, Math.floor(secs));
    const m = Math.floor(safeSecs / 60);
    const s = safeSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(fraction * duration);
  };

  const speedOptions = [0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl shadow-indigo-950/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Call Title & Active Speaker */}
        <div className="min-w-0 md:max-w-xs lg:max-w-sm flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              currentSpeakerRole === 'rep'
                ? 'bg-indigo-950/80 border-indigo-500/40 text-indigo-400'
                : currentSpeakerRole === 'prospect'
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isPlaying ? (
              <Radio className="w-5 h-5 animate-pulse" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div className="truncate">
            <h4 className="text-sm font-semibold text-slate-100 truncate" title={callTitle}>
              {callTitle}
            </h4>
            <div className="flex items-center gap-2 text-xs">
              {currentSpeakerLabel ? (
                <span
                  className={`font-medium ${
                    currentSpeakerRole === 'rep'
                      ? 'text-indigo-400'
                      : 'text-amber-400'
                  }`}
                >
                  Speaking: {currentSpeakerLabel}
                </span>
              ) : (
                <span className="text-slate-400">Ready to play</span>
              )}
              {hasAudioMedia && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  HD Audio
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="flex-1 max-w-2xl flex flex-col gap-2">
          {/* Main buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              title="Rewind 10 seconds"
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onPlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              title="Fast-forward 10 seconds"
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Timeline track & timestamps */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 w-11 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>

            <div
              ref={progressBarRef}
              onClick={handleProgressBarClick}
              className="relative flex-1 h-3 bg-slate-800 hover:bg-slate-700/80 rounded-full cursor-pointer overflow-hidden group transition-all"
            >
              {/* Simulated subtle waveform background bars */}
              <div className="absolute inset-0 flex items-center justify-between px-1 opacity-20 pointer-events-none">
                {Array.from({ length: 48 }).map((_, i) => {
                  const height = 20 + ((i * 37) % 70);
                  return (
                    <div
                      key={i}
                      className="w-0.5 bg-slate-400 rounded-full"
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>

              {/* Progress bar fill */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all group-hover:brightness-110"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Scrubber thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"
                style={{ left: `${progressPercent}%` }}
              />
            </div>

            <span className="text-xs font-mono text-slate-400 w-11 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Speed & Volume */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          {/* Speed switcher */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-750">
            <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {speedOptions.map((rate) => (
              <button
                key={rate}
                onClick={() => onChangePlaybackRate(rate)}
                className={`px-2 py-0.5 text-xs font-medium rounded-lg transition-colors ${
                  playbackRate === rate
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
