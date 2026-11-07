import React, { useState, useEffect, useRef } from 'react';
import { SubtitleCue } from '../../types/movie';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Sliders,
  Type,
  Subtitles,
  Film,
  Sparkles,
} from 'lucide-react';

interface VideoPlayerWithSubtitlesProps {
  videoUrl?: string;
  posterGradient?: string;
  movieTitle: string;
  durationSeconds: number;
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  subtitles: SubtitleCue[];
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
}

export const VideoPlayerWithSubtitles: React.FC<VideoPlayerWithSubtitlesProps> = ({
  videoUrl,
  posterGradient = 'from-cyan-950 via-slate-900 to-indigo-950',
  movieTitle,
  durationSeconds,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  subtitles,
  playbackRate,
  onChangePlaybackRate,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [subtitleColor, setSubtitleColor] = useState<'yellow' | 'white' | 'cyan'>('yellow');
  const [subtitleSize, setSubtitleSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [showSpeakerTag, setShowSpeakerTag] = useState(true);
  const [subtitlePosition, setSubtitlePosition] = useState<'bottom' | 'top'>('bottom');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Find currently active subtitle cue
  const activeCue = subtitles.find(
    (cue) => currentTime >= cue.startSeconds && currentTime <= cue.endSeconds
  );

  // Sync real video element if videoUrl is provided
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.3) {
        videoRef.current.currentTime = currentTime;
      }
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      videoRef.current.playbackRate = playbackRate;
    }
  }, [currentTime, isPlaying, playbackRate, videoUrl]);

  // Synthetic cinematic canvas rendering when no raw video file is uploaded
  useEffect(() => {
    if (videoUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space / cinematic film grain gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#0b1120');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cinematic anamorphic flare & star field
      const timeFactor = currentTime * 25;
      for (let i = 0; i < 40; i++) {
        const x = (i * 47 + timeFactor * 0.2) % canvas.width;
        const y = (i * 31) % canvas.height;
        const radius = (i % 3 === 0) ? 1.5 : 0.8;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Anamorphic horizontal cyan lens streak
      const flareY = canvas.height * 0.45;
      const flareGrad = ctx.createLinearGradient(0, flareY, canvas.width, flareY);
      flareGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      flareGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.25)');
      flareGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, flareY - 1, canvas.width, 2);

      // 2.39:1 Cinematic Letterbox Bars
      ctx.fillStyle = '#000000';
      const letterboxHeight = canvas.height * 0.08;
      ctx.fillRect(0, 0, canvas.width, letterboxHeight);
      ctx.fillRect(0, canvas.height - letterboxHeight, canvas.width, letterboxHeight);

      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [videoUrl, currentTime, isPlaying]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return `${String(m).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const progressPercent = durationSeconds > 0 ? (currentTime / durationSeconds) * 100 : 0;

  const getColorClass = () => {
    switch (subtitleColor) {
      case 'yellow':
        return 'text-[#ffe600] text-shadow-yellow';
      case 'cyan':
        return 'text-cyan-300';
      default:
        return 'text-white';
    }
  };

  const getSizeClass = () => {
    switch (subtitleSize) {
      case 'sm':
        return 'text-sm sm:text-base';
      case 'lg':
        return 'text-xl sm:text-2xl font-bold';
      default:
        return 'text-base sm:text-xl font-semibold';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group select-none"
    >
      {/* Video or Simulated Cinematic Display */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            muted={isMuted}
            playsInline
            onClick={onPlayPause}
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={854}
            height={480}
            className="w-full h-full object-contain"
            onClick={onPlayPause}
          />
        )}

        {/* Ambient Film Grain Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-radial-gradient from-transparent via-black/40 to-black/80" />

        {/* Center Play Button Overlay on Pause */}
        {!isPlaying && (
          <button
            onClick={onPlayPause}
            className="absolute z-10 w-16 h-16 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white flex items-center justify-center border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all active:scale-95 group-hover:scale-105"
          >
            <Play className="w-7 h-7 fill-current ml-1" />
          </button>
        )}

        {/* Top Info Bar */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-xs z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-full text-slate-300 pointer-events-auto">
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white truncate max-w-xs">{movieTitle}</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/40">
              24 FPS • 2.39:1
            </span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Subtitle styling options"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtitle Styling Settings Popover */}
        {showSettings && (
          <div className="absolute top-12 right-4 z-30 bg-slate-900/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl text-xs w-64 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Subtitles className="w-3.5 h-3.5 text-indigo-400" /> Subtitle Appearance
              </span>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Color
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setSubtitleColor('yellow')}
                  className={`py-1 rounded font-semibold transition-colors ${
                    subtitleColor === 'yellow'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Yellow
                </button>
                <button
                  onClick={() => setSubtitleColor('white')}
                  className={`py-1 rounded font-semibold transition-colors ${
                    subtitleColor === 'white'
                      ? 'bg-slate-700 text-white border border-slate-500'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => setSubtitleColor('cyan')}
                  className={`py-1 rounded font-semibold transition-colors ${
                    subtitleColor === 'cyan'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Cyan
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Size
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['sm', 'md', 'lg'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSubtitleSize(sz)}
                    className={`py-1 rounded font-semibold uppercase text-[10px] ${
                      subtitleSize === sz
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {sz === 'sm' ? 'Small' : sz === 'md' ? 'Medium' : 'Large'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-[11px] text-slate-300">Show Speaker Tag</span>
              <button
                onClick={() => setShowSpeakerTag(!showSpeakerTag)}
                className={`w-8 h-4 rounded-full transition-colors relative ${
                  showSpeakerTag ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                    showSpeakerTag ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE SUBTITLE OVERLAY */}
        {activeCue && (
          <div
            className={`absolute left-4 right-4 z-20 flex flex-col items-center pointer-events-none transition-all duration-150 ${
              subtitlePosition === 'top' ? 'top-10' : 'bottom-16 sm:bottom-20'
            }`}
          >
            <div className="bg-black/75 backdrop-blur-sm px-4 py-1.5 rounded-lg max-w-2xl text-center border border-black/40 shadow-2xl">
              {showSpeakerTag && activeCue.speaker && (
                <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-300 mr-2 block sm:inline">
                  [{activeCue.speaker}]
                </span>
              )}
              <span
                className={`${getColorClass()} ${getSizeClass()} tracking-wide leading-relaxed font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]`}
              >
                {activeCue.text}
              </span>
              {activeCue.soundEffect && (
                <div className="text-xs italic text-slate-400 mt-0.5">
                  {activeCue.soundEffect}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TIMELINE SCRUBBER & CONTROLS */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
        {/* Scrubber Track with Subtitle Cue Markers */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            onSeek(fraction * durationSeconds);
          }}
          className="relative h-3 bg-slate-800 hover:bg-slate-750 rounded-full cursor-pointer overflow-hidden group transition-all"
        >
          {/* Subtitle Cue blocks visual indicator */}
          {subtitles.map((cue) => {
            const leftPct = (cue.startSeconds / durationSeconds) * 100;
            const widthPct = ((cue.endSeconds - cue.startSeconds) / durationSeconds) * 100;
            return (
              <div
                key={cue.id}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                className="absolute top-0 bottom-0 bg-indigo-500/40 border-l border-r border-indigo-400/60 pointer-events-none"
                title={`${cue.speaker ? cue.speaker + ': ' : ''}${cue.text}`}
              />
            );
          })}

          {/* Progress fill */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Scrubber thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPlayPause}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => onSeek(Math.max(0, currentTime - 5))}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Rewind 5s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSeek(Math.min(durationSeconds, currentTime + 5))}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Forward 5s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Time readout */}
            <div className="font-mono text-xs text-slate-400 ml-2">
              <span className="text-white font-bold">{formatTime(currentTime)}</span> / {formatTime(durationSeconds)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Speed buttons */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
              {[0.75, 1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => onChangePlaybackRate(rate)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    playbackRate === rate ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
