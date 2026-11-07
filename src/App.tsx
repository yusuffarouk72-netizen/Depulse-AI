/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Download,
  Upload,
  Sparkles,
  ChevronDown,
  Play,
  Share2,
  FileCode,
  Layers,
  Activity,
  Clapperboard,
  Users,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Languages,
} from 'lucide-react';

import { MovieAnalysisResult, SubtitleCue } from './types/movie';
import { SAMPLE_MOVIES } from './data/sampleMovies';
import { VideoPlayerWithSubtitles } from './components/movie/VideoPlayerWithSubtitles';
import { SrtSubtitleEditor } from './components/movie/SrtSubtitleEditor';
import { MovieSceneBreakdown } from './components/movie/MovieSceneBreakdown';
import { CinematicTensionGraph } from './components/movie/CinematicTensionGraph';
import { CharacterDialogueMetrics } from './components/movie/CharacterDialogueMetrics';
import { MovieUploadModal } from './components/movie/MovieUploadModal';
import { MovieExportModal } from './components/movie/MovieExportModal';
import { generateSrtContent, downloadFile } from './utils/srtUtils';
import { SynthesizedAudioEngine } from './utils/audioSimulator';

export default function App() {
  const [activeMovie, setActiveMovie] = useState<MovieAnalysisResult>(SAMPLE_MOVIES[0]);
  const [movieHistory, setMovieHistory] = useState<MovieAnalysisResult[]>(SAMPLE_MOVIES);

  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMovieDropdownOpen, setIsMovieDropdownOpen] = useState(false);

  // Synthesized audio engine for sample movies without local files
  const synthEngineRef = useRef<SynthesizedAudioEngine | null>(null);

  useEffect(() => {
    synthEngineRef.current = new SynthesizedAudioEngine(activeMovie.durationSeconds || 150);
    synthEngineRef.current.setCallbacks(
      (time) => setCurrentTime(time),
      () => setIsPlaying(false)
    );

    return () => {
      synthEngineRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (synthEngineRef.current) {
      synthEngineRef.current.setDuration(activeMovie.durationSeconds || 150);
      synthEngineRef.current.seek(0);
    }
    setCurrentTime(0);
    setIsPlaying(false);
  }, [activeMovie]);

  const handlePlayPause = () => {
    if (isPlaying) {
      synthEngineRef.current?.pause();
      setIsPlaying(false);
    } else {
      synthEngineRef.current?.setPlaybackRate(playbackRate);
      synthEngineRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    synthEngineRef.current?.seek(seconds);
  };

  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    synthEngineRef.current?.setPlaybackRate(rate);
  };

  // Keyboard shortcut: Spacebar toggles Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        handlePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Handle subtitle updates from the editor
  const handleUpdateSubtitles = (updatedSubtitles: SubtitleCue[]) => {
    setActiveMovie((prev) => ({
      ...prev,
      subtitles: updatedSubtitles,
      metrics: {
        ...prev.metrics,
        subtitleCount: updatedSubtitles.length,
        totalDialogueWords: updatedSubtitles.reduce((acc, c) => acc + c.text.split(' ').length, 0),
      },
    }));
  };

  // Handle new movie analyzed from upload
  const handleAnalysisComplete = (newMovie: MovieAnalysisResult, blobUrl?: string) => {
    if (blobUrl) {
      setVideoBlobUrl(blobUrl);
    } else {
      setVideoBlobUrl(null);
    }
    setActiveMovie(newMovie);
    setMovieHistory((prev) => [newMovie, ...prev.filter((m) => m.id !== newMovie.id)]);
  };

  // Quick download .SRT button in header
  const handleQuickDownloadSrt = () => {
    const srtText = generateSrtContent(activeMovie.subtitles, true);
    const safeTitle = activeMovie.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'subtitles';
    downloadFile(srtText, `${safeTitle}.en.srt`, 'text/plain;charset=utf-8');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Film className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  CineScript<span className="text-cyan-400">.srt</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hidden sm:inline-block">
                  Film Intelligence & Subtitle Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Movie Analysis • Scene Diarization • Standard English .SRT Subtitles
              </p>
            </div>
          </div>

          {/* Active Movie Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMovieDropdownOpen(!isMovieDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors max-w-xs sm:max-w-md truncate"
            >
              <Clapperboard className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate font-semibold">{activeMovie.title}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isMovieDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
                <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1.5">
                  Available Movie Projects
                </div>
                {movieHistory.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveMovie(m);
                      setIsMovieDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors ${
                      activeMovie.id === m.id
                        ? 'bg-indigo-950/60 text-indigo-200 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold truncate">{m.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {m.durationFormatted} • {m.subtitles.length} cues • {m.genre[0]}
                      </div>
                    </div>
                    {activeMovie.id === m.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickDownloadSrt}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-white font-semibold transition-colors"
              title="Download standard English .SRT file"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download .SRT</span>
            </button>

            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 font-medium transition-colors"
              title="Export Subtitles & Movie Analysis Dossier"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Analyze Movie</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN DASHBOARD */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Film Header Banner & Quick Specs */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {activeMovie.genre.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                  >
                    {g}
                  </span>
                ))}
                <span className="text-xs text-slate-400 font-mono">
                  Duration: {activeMovie.durationFormatted}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-mono">
                  Audio Clarity: {activeMovie.audioClarityScore}%
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-emerald-400 font-mono bg-emerald-950/50 px-2 py-0.2 rounded border border-emerald-800/40">
                  Netflix CPS Compliant
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {activeMovie.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl italic">
                "{activeMovie.logline}"
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const nextIdx =
                    (SAMPLE_MOVIES.findIndex((m) => m.id === activeMovie.id) + 1) %
                    SAMPLE_MOVIES.length;
                  setActiveMovie(SAMPLE_MOVIES[nextIdx]);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                title="Switch sample movie"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Switch Scene</span>
              </button>

              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Upload Movie File</span>
              </button>
            </div>
          </div>
        </div>

        {/* TOP ROW: VIDEO PLAYER WITH SUBTITLES (7 COLS) & SRT EDITOR (5 COLS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Video Player with Subtitles */}
          <div className="lg:col-span-7 space-y-4">
            <VideoPlayerWithSubtitles
              videoUrl={videoBlobUrl || undefined}
              posterGradient={activeMovie.posterGradient}
              movieTitle={activeMovie.title}
              durationSeconds={activeMovie.durationSeconds}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              subtitles={activeMovie.subtitles}
              playbackRate={playbackRate}
              onChangePlaybackRate={handleChangePlaybackRate}
            />

            {/* Quick Director Style Notes Card */}
            {activeMovie.directorStyleNotes && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 mt-0.5">
                  <Clapperboard className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5">
                    Cinematography & Sound Design Analysis:
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    {activeMovie.directorStyleNotes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: .SRT Subtitle Studio */}
          <div className="lg:col-span-5">
            <SrtSubtitleEditor
              subtitles={activeMovie.subtitles}
              currentTime={currentTime}
              onSeek={handleSeek}
              onUpdateSubtitles={handleUpdateSubtitles}
              movieTitle={activeMovie.title}
            />
          </div>
        </div>

        {/* MIDDLE ROW: CINEMATIC TENSION & PACING GRAPH */}
        <CinematicTensionGraph
          tensionPoints={activeMovie.tensionGraph}
          durationSeconds={activeMovie.durationSeconds}
          currentTime={currentTime}
          onSeek={handleSeek}
        />

        {/* BOTTOM ROW: SCENE BREAKDOWN (7 COLS) & CHARACTER DIARIZATION (5 COLS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <MovieSceneBreakdown
              scenes={activeMovie.scenes}
              currentTime={currentTime}
              onSeek={handleSeek}
            />
          </div>

          <div className="lg:col-span-5">
            <CharacterDialogueMetrics characters={activeMovie.characters} />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>CineScript AI • Film Analysis, Character Diarization, and SubRip (.SRT) English Subtitle Studio</p>
      </footer>

      {/* MODALS */}
      <MovieUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <MovieExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        movie={activeMovie}
      />
    </div>
  );
}
