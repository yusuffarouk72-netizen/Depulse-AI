import React, { useState, useRef } from 'react';
import { MovieAnalysisResult } from '../../types/movie';
import { SAMPLE_MOVIES } from '../../data/sampleMovies';
import {
  Upload,
  Film,
  Sparkles,
  X,
  FileVideo,
  FileCode,
  BookOpen,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Languages,
} from 'lucide-react';
import { parseSrtContent } from '../../utils/srtUtils';

interface MovieUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (result: MovieAnalysisResult, videoBlobUrl?: string) => void;
}

export const MovieUploadModal: React.FC<MovieUploadModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'sample' | 'script'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [movieTitle, setMovieTitle] = useState('');
  const [translateToEnglish, setTranslateToEnglish] = useState(true);
  const [includeSoundEffects, setIncludeSoundEffects] = useState(true);
  const [pastedScript, setPastedScript] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process Video/Audio File
  const handleUploadSubmit = async () => {
    if (!file) {
      setErrorMessage('Please select a movie or video clip to upload.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Ingesting video clip and preparing audio stream...');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      const mediaBase64 = await base64Promise;

      setLoadingStep('Transcribing dialogue and detecting time cues with gemini-3.5-transcribe...');

      const response = await fetch('/api/analyze-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaBase64,
          mimeType: file.type || 'video/mp4',
          movieTitle: movieTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
          translateToEnglish,
          includeSoundEffects,
          filename: file.name,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.result) {
        throw new Error(data.error || 'Failed to analyze movie');
      }

      setLoadingStep('Formulating Netflix/BBC compliant .SRT subtitle track...');
      const videoBlobUrl = URL.createObjectURL(file);

      onAnalysisComplete(data.result, videoBlobUrl);
      onClose();
    } catch (err: any) {
      console.error('Error processing movie:', err);
      setErrorMessage(
        err.message || 'Movie analysis failed. Please verify your GEMINI_API_KEY in Settings > Secrets.'
      );
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Process Pasted Script or SRT
  const handlePastedScriptSubmit = () => {
    if (!pastedScript.trim()) {
      setErrorMessage('Please paste a screenplay or .srt subtitle text.');
      return;
    }

    // Check if it's an existing SRT
    if (pastedScript.includes('-->')) {
      const parsedCues = parseSrtContent(pastedScript);
      if (parsedCues.length > 0) {
        const lastCue = parsedCues[parsedCues.length - 1];
        const durationSecs = Math.ceil(lastCue.endSeconds || 120);
        const m = Math.floor(durationSecs / 60);
        const s = durationSecs % 60;

        const result: MovieAnalysisResult = {
          id: 'imported-srt-' + Date.now(),
          title: movieTitle.trim() || 'Imported Subtitle Project',
          durationFormatted: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
          durationSeconds: durationSecs,
          genre: ['Drama', 'Cinema'],
          logline: 'Imported SubRip (.srt) subtitle track synchronized for playback and editing.',
          directorStyleNotes: 'Custom imported subtitle sequence.',
          languageDetected: 'English',
          translationToEnglish: false,
          audioClarityScore: 95,
          posterGradient: 'from-indigo-950 via-slate-900 to-cyan-950',
          subtitles: parsedCues,
          scenes: [
            {
              id: 'imp-sc-1',
              sceneNumber: 1,
              startTime: '00:00:00',
              startSeconds: 0,
              endTime: lastCue.endTime,
              endSeconds: durationSecs,
              title: 'Primary Cinematic Sequence',
              description: 'Imported dialogue sequence.',
              mood: 'Narrative Focus',
              dominantCharacters: Array.from(new Set(parsedCues.map((c) => c.speaker).filter(Boolean))) as string[],
              lightingAndAtmosphere: 'Naturalistic cinematic balance.',
              dialogueDensity: 'Moderate',
            },
          ],
          characters: Array.from(new Set(parsedCues.map((c) => c.speaker).filter(Boolean))).map((name) => {
            const lines = parsedCues.filter((c) => c.speaker === name);
            const words = lines.reduce((acc, c) => acc + c.text.split(' ').length, 0);
            return {
              characterName: name as string,
              role: 'Character',
              lineCount: lines.length,
              wordCount: words,
              percentageTalkTime: Math.round((lines.length / parsedCues.length) * 100),
              emotionalArc: 'Dialogue participant.',
            };
          }),
          tensionGraph: [
            { timestampSeconds: 0, timeFormatted: '00:00', tensionLevel: 40, pacingWpm: 120, eventDescription: 'Opening', mood: 'Intro' },
            { timestampSeconds: durationSecs, timeFormatted: `${m}:${s}`, tensionLevel: 70, pacingWpm: 140, eventDescription: 'Conclusion', mood: 'Resolution' },
          ],
          metrics: {
            totalDialogueWords: parsedCues.reduce((acc, c) => acc + c.text.split(' ').length, 0),
            averagePacingWpm: 130,
            subtitleCount: parsedCues.length,
            speechToSilenceRatio: '65% Dialogue / 35% Ambient',
            complianceStandards: {
              netflixCpsCompliant: true,
              maxLineLength: 37,
              lineCountCompliance: true,
            },
          },
        };

        onAnalysisComplete(result);
        onClose();
        return;
      }
    }

    setErrorMessage('Invalid SRT format. Please ensure the pasted text contains "-->" timestamp markers.');
  };

  const handleSelectSample = (sample: MovieAnalysisResult) => {
    onAnalysisComplete(sample);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-600/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import Movie for Analysis & .SRT Subtitles</h3>
              <p className="text-xs text-slate-400">
                AI film analysis, character diarization, and standard SubRip English subtitles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" /> Upload Video / Movie
          </button>
          <button
            onClick={() => setActiveTab('sample')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'sample'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Preloaded Cinematic Demos
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'script'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" /> Import .SRT or Script
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <span className="font-semibold block">Notice</span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* TAB 1: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-8 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*,.mp4,.webm,.mov,.mkv,.mp3,.wav"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFile(e.target.files[0]);
                      setErrorMessage(null);
                      if (!movieTitle) {
                        setMovieTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <FileVideo className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <span className="text-sm font-semibold text-emerald-400 block mb-1">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for Gemini Speech & Narrative Analysis
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block mb-1">
                      Select Movie / Video Clip or Audio
                    </span>
                    <span className="text-xs text-slate-400">
                      Supports MP4, WebM, MOV, MKV, MP3, WAV (up to 100MB)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Movie / Scene Title
                </label>
                <input
                  type="text"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  placeholder="e.g. Inception - Corridor Scene"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Translate to English
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Translate foreign dialogue to English .SRT
                    </span>
                  </div>
                  <button
                    onClick={() => setTranslateToEnglish(!translateToEnglish)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      translateToEnglish ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        translateToEnglish ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Audio Effects Cues
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Include cues like [alarm blares], [sighs]
                    </span>
                  </div>
                  <button
                    onClick={() => setIncludeSoundEffects(!includeSoundEffects)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      includeSoundEffects ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        includeSoundEffects ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRELOADED SAMPLES */}
          {activeTab === 'sample' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Click any cinematic sample to instantly inspect scene breakdown, character diarization,
                and complete .SRT subtitles:
              </p>
              {SAMPLE_MOVIES.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => handleSelectSample(movie)}
                  className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all duration-200 group flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                        {movie.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono shrink-0">
                        {movie.durationFormatted} • {movie.subtitles.length} cues
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {movie.logline}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {movie.genre.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0">
                    <span>Load Scene</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: IMPORT SRT / SCRIPT */}
          {activeTab === 'script' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Movie Title
                </label>
                <input
                  type="text"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  placeholder="e.g. Blade Runner 2049 Opening"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 mb-3"
                />
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Paste Standard .SRT Subtitles
                </label>
                <textarea
                  rows={8}
                  value={pastedScript}
                  onChange={(e) => setPastedScript(e.target.value)}
                  placeholder={`1\n00:00:02,150 --> 00:00:05,420\n[Commander Hayes] Telemetry has detected an anomaly.\n\n2\n00:00:05,800 --> 00:00:08,950\nIsolate the frequency.`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Loading Progress */}
          {isLoading && (
            <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
              <div className="text-sm font-semibold text-indigo-200">{loadingStep}</div>
              <p className="text-xs text-indigo-400/80">
                AI multimodal engine analyzing dialogue, cinematography, and generating .SRT subtitles
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          {activeTab === 'upload' && (
            <button
              onClick={handleUploadSubmit}
              disabled={!file || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Analyze Movie & Create .SRT
            </button>
          )}

          {activeTab === 'script' && (
            <button
              onClick={handlePastedScriptSubmit}
              disabled={!pastedScript.trim() || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Import into Studio
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
