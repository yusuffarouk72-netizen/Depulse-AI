/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Mic,
  Share2,
  FileText,
  ChevronDown,
  PhoneCall,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

import { CallAnalysisResult } from './types/sales';
import { SAMPLE_CALLS } from './data/sampleCalls';
import { ScorecardMetrics } from './components/ScorecardMetrics';
import { SentimentGraph } from './components/SentimentGraph';
import { CoachingCard } from './components/CoachingCard';
import { DiarizedTranscript } from './components/DiarizedTranscript';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { UploadModal } from './components/UploadModal';
import { ExportModal } from './components/ExportModal';
import { SynthesizedAudioEngine } from './utils/audioSimulator';

export default function App() {
  // Active call state - defaults to the first rich sample call
  const [activeCall, setActiveCall] = useState<CallAnalysisResult>(SAMPLE_CALLS[0]);
  const [callHistory, setCallHistory] = useState<CallAnalysisResult[]>(SAMPLE_CALLS);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCallDropdownOpen, setIsCallDropdownOpen] = useState(false);

  // References
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const synthEngineRef = useRef<SynthesizedAudioEngine | null>(null);

  // Setup synthesized audio engine for sample calls
  useEffect(() => {
    synthEngineRef.current = new SynthesizedAudioEngine(activeCall.callDurationSeconds || 420);
    synthEngineRef.current.setCallbacks(
      (time) => setCurrentTime(time),
      () => setIsPlaying(false)
    );

    return () => {
      synthEngineRef.current?.destroy();
    };
  }, []);

  // Update engine duration when active call changes
  useEffect(() => {
    if (synthEngineRef.current) {
      synthEngineRef.current.setDuration(activeCall.callDurationSeconds || 420);
      synthEngineRef.current.seek(0);
    }
    setCurrentTime(0);
    setIsPlaying(false);
  }, [activeCall]);

  // Handle Play / Pause toggle
  const handlePlayPause = () => {
    if (audioBlobUrl && audioElementRef.current) {
      // Use real HTML5 audio
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.playbackRate = playbackRate;
        audioElementRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Audio play request failed:', err);
            // Fallback to synth engine if audio blob cannot play
            synthEngineRef.current?.play();
            setIsPlaying(true);
          });
      }
    } else {
      // Use synthesized timeline engine
      if (isPlaying) {
        synthEngineRef.current?.pause();
        setIsPlaying(false);
      } else {
        synthEngineRef.current?.setPlaybackRate(playbackRate);
        synthEngineRef.current?.play();
        setIsPlaying(true);
      }
    }
  };

  // Handle Audio Seeking
  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    if (audioBlobUrl && audioElementRef.current) {
      audioElementRef.current.currentTime = seconds;
    }
    if (synthEngineRef.current) {
      synthEngineRef.current.seek(seconds);
    }
  };

  // Handle Playback rate change
  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioBlobUrl && audioElementRef.current) {
      audioElementRef.current.playbackRate = rate;
    }
    if (synthEngineRef.current) {
      synthEngineRef.current.setPlaybackRate(rate);
    }
  };

  // Keyboard shortcut: Spacebar to toggle Play/Pause
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

  // Calculate current speaker based on currentTime
  const currentUtterance = React.useMemo(() => {
    const transcript = activeCall.diarizedTranscript || [];
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (currentTime >= transcript[i].timestampSeconds) {
        return transcript[i];
      }
    }
    return transcript[0];
  }, [activeCall, currentTime]);

  // Handle new analysis completed
  const handleAnalysisComplete = (newCall: CallAnalysisResult, blobUrl?: string) => {
    if (blobUrl) {
      setAudioBlobUrl(blobUrl);
    } else {
      setAudioBlobUrl(null);
    }
    setActiveCall(newCall);
    setCallHistory((prev) => [newCall, ...prev.filter((c) => c.id !== newCall.id)]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Hidden real audio element for uploaded/recorded files */}
      {audioBlobUrl && (
        <audio
          ref={audioElementRef}
          src={audioBlobUrl}
          onTimeUpdate={() => {
            if (audioElementRef.current) {
              setCurrentTime(audioElementRef.current.currentTime);
            }
          }}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  DealPulse<span className="text-cyan-400">.ai</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hidden sm:inline-block">
                  Sales Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Diarization • Sentiment Graph • 3x3 Coaching Cards
              </p>
            </div>
          </div>

          {/* Active Call Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCallDropdownOpen(!isCallDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors max-w-xs sm:max-w-md truncate"
            >
              <PhoneCall className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate font-semibold">{activeCall.callTitle}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isCallDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
                <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1.5">
                  Available Call Recordings
                </div>
                {callHistory.map((call) => (
                  <button
                    key={call.id}
                    onClick={() => {
                      setActiveCall(call);
                      setIsCallDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors ${
                      activeCall.id === call.id
                        ? 'bg-indigo-950/60 text-indigo-200 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold truncate">{call.callTitle}</div>
                      <div className="text-[10px] text-slate-400">
                        {call.callDurationFormatted} • Score: {call.scorecard.overallScore}/100
                      </div>
                    </div>
                    {activeCall.id === call.id && (
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
              onClick={() => setIsExportOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs text-slate-300 font-medium transition-colors"
              title="Export Coaching Brief as Markdown or PDF"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Analyze New Call</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-36">
        {/* Deal Call Header & Quick Context */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/30 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {activeCall.coachingCard.dealStage} Stage
                </span>
                <span className="text-xs text-slate-400">
                  Recorded: {activeCall.recordedAt || 'Recent'}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">
                  Duration: {activeCall.callDurationFormatted}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {activeCall.callTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
                {activeCall.coachingCard.primaryBuyerPain
                  ? `Pain Point: ${activeCall.coachingCard.primaryBuyerPain}`
                  : 'AI-assisted conversation intelligence and deal coaching analysis.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              >
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span>Microphone Input</span>
              </button>

              <button
                onClick={() => {
                  const nextIndex =
                    (SAMPLE_CALLS.findIndex((c) => c.id === activeCall.id) + 1) %
                    SAMPLE_CALLS.length;
                  setActiveCall(SAMPLE_CALLS[nextIndex]);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                title="Cycle sample calls"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Switch Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. KEY SCORECARD METRICS ROW */}
        <ScorecardMetrics scorecard={activeCall.scorecard} />

        {/* 2. SENTIMENT & ENGAGEMENT GRAPH (OVER CALL DURATION) */}
        <SentimentGraph
          sentimentPoints={activeCall.sentimentGraph}
          durationSeconds={activeCall.callDurationSeconds}
          currentTime={currentTime}
          onSeek={handleSeek}
        />

        {/* 3. TWO-COLUMN SPLIT: AI COACHING CARD & DIARIZED TRANSCRIPT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: COACHING CARD (3 Things Done Well & 3 Missed Opportunities) */}
          <div className="lg:col-span-7 space-y-6">
            <CoachingCard
              coachingCard={activeCall.coachingCard}
              onSeek={handleSeek}
            />
          </div>

          {/* RIGHT: DIARIZED TRANSCRIPT (Speaker A vs Speaker B) */}
          <div className="lg:col-span-5 space-y-6">
            <DiarizedTranscript
              transcript={activeCall.diarizedTranscript}
              currentTime={currentTime}
              onSeek={handleSeek}
            />
          </div>
        </div>
      </main>

      {/* FIXED BOTTOM AUDIO PLAYER BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 p-4 max-w-7xl mx-auto pointer-events-none">
        <div className="pointer-events-auto">
          <AudioPlayerBar
            currentTime={currentTime}
            duration={activeCall.callDurationSeconds || 420}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            playbackRate={playbackRate}
            onChangePlaybackRate={handleChangePlaybackRate}
            currentSpeakerLabel={currentUtterance?.speakerLabel}
            currentSpeakerRole={currentUtterance?.role}
            callTitle={activeCall.callTitle}
            hasAudioMedia={Boolean(audioBlobUrl)}
          />
        </div>
      </footer>

      {/* MODALS */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        call={activeCall}
      />
    </div>
  );
}
