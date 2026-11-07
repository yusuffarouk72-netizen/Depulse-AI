import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Mic,
  FileText,
  Sparkles,
  X,
  Play,
  Square,
  Pause,
  AlertCircle,
  CheckCircle2,
  FileAudio,
  Radio,
  BookOpen,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { CallAnalysisResult } from '../types/sales';
import { SAMPLE_CALLS } from '../data/sampleCalls';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (result: CallAnalysisResult, audioBlobUrl?: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'sample' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [repName, setRepName] = useState('Sarah (Account Executive)');
  const [prospectName, setProspectName] = useState('Marcus (VP Engineering)');
  const [callContext, setCallContext] = useState('Final Pricing & Security Architecture Review');
  const [pastedTranscript, setPastedTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Microphone recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    setErrorMessage(null);
    setRecordedAudioBlob(null);
    audioChunksRef.current = [];
    setRecordSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      drawWaveform();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedAudioBlob(blob);
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setIsPaused(false);

      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setErrorMessage(
        err.message || 'Microphone access denied. Please allow microphone permissions in your browser.'
      );
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        recordTimerRef.current = window.setInterval(() => {
          setRecordSeconds((prev) => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgb(${99 + dataArray[i] / 2}, ${102}, ${241})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };
    render();
  };

  // Process File Upload or Recorded Blob
  const processAudio = async (audioBlob: Blob, filename: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Transcribing audio with gemini-3.5-transcribe...');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          // Extract base64 without prefix
          const base64 = res.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      setLoadingStep('Diarizing speakers & calculating sentiment curve with gemini-3.8-flash...');

      const response = await fetch('/api/analyze-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: audioBlob.type || 'audio/mp3',
          filename,
          repName,
          prospectName,
          callContext,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.result) {
        throw new Error(data.error || 'Failed to analyze call');
      }

      setLoadingStep('Generating 3-good & 3-missed coaching intelligence card...');
      const blobUrl = URL.createObjectURL(audioBlob);

      onAnalysisComplete(data.result, blobUrl);
      onClose();
    } catch (err: any) {
      console.error('Error processing audio call:', err);
      setErrorMessage(
        err.message || 'Analysis failed. Please verify your GEMINI_API_KEY in Settings > Secrets.'
      );
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleUploadSubmit = () => {
    if (!file) {
      setErrorMessage('Please select an audio file to upload.');
      return;
    }
    processAudio(file, file.name);
  };

  const handleRecordSubmit = () => {
    if (!recordedAudioBlob) {
      setErrorMessage('Please record some audio before submitting.');
      return;
    }
    processAudio(recordedAudioBlob, 'microphone_recording.webm');
  };

  const handlePasteSubmit = async () => {
    if (!pastedTranscript.trim()) {
      setErrorMessage('Please paste transcript text to analyze.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Analyzing conversation dynamics with gemini-3.8-flash...');

    try {
      const resp = await fetch('/api/analyze-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptText: pastedTranscript,
          repName,
          prospectName,
          callTitle: callContext || 'Sales Coaching Analysis',
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${resp.status}`);
      }

      const data = await resp.json();
      if (!data.success || !data.result) {
        throw new Error(data.error || 'Analysis failed');
      }

      onAnalysisComplete(data.result);
      onClose();
    } catch (err: any) {
      console.error('Error analyzing pasted transcript:', err);
      setErrorMessage(err.message || 'Failed to analyze transcript.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSelectSample = (sample: CallAnalysisResult) => {
    onAnalysisComplete(sample);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import Call for AI Coaching</h3>
              <p className="text-xs text-slate-400">
                Upload audio, record live, or select enterprise demo calls
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
            <Upload className="w-4 h-4" /> Upload Audio File
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'record'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" /> Live Microphone
          </button>
          <button
            onClick={() => setActiveTab('sample')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'sample'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Preloaded Demos
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'paste'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Paste Transcript
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <span className="font-semibold block">Processing Note</span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* TAB 1: UPLOAD AUDIO */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFile(e.target.files[0]);
                      setErrorMessage(null);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <FileAudio className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <span className="text-sm font-semibold text-emerald-400 block mb-1">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to transcribe with{' '}
                      <code className="text-indigo-400">gemini-3.5-transcribe</code>
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block mb-1">
                      Choose sales call audio file or drop here
                    </span>
                    <span className="text-xs text-slate-400">
                      Supports MP3, WAV, M4A, WEBM, OGG (up to 50MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Rep & Prospect metadata */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Sales Rep Name (Speaker A)
                  </label>
                  <input
                    type="text"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Prospect / Buyer Name (Speaker B)
                  </label>
                  <input
                    type="text"
                    value={prospectName}
                    onChange={(e) => setProspectName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Call Context / Deal Name
                </label>
                <input
                  type="text"
                  value={callContext}
                  onChange={(e) => setCallContext(e.target.value)}
                  placeholder="e.g. Acme Corp Enterprise Cloud Pricing Review"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: MICROPHONE RECORDING */}
          {activeTab === 'record' && (
            <div className="space-y-4 text-center">
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center">
                {/* Visualizer canvas */}
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={80}
                  className="w-full h-20 mb-4 rounded-xl bg-slate-900/60"
                />

                <div className="text-3xl font-extrabold text-white font-mono mb-4 tracking-wider">
                  {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:
                  {String(recordSeconds % 60).padStart(2, '0')}
                </div>

                <div className="flex items-center justify-center gap-3">
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                    >
                      <Mic className="w-4 h-4" /> Start Recording
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handlePauseRecording}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                      <button
                        onClick={handleStopRecording}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" /> Stop
                      </button>
                    </>
                  )}
                </div>

                {recordedAudioBlob && !isRecording && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Recording ready ({recordSeconds}s). Transcribing with{' '}
                      <strong>gemini-3.5-transcribe</strong>.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRELOADED SAMPLE CALLS */}
          {activeTab === 'sample' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Click any real-world sales recording to instantly inspect the diarized transcript,
                sentiment timeline, and AI coaching card:
              </p>
              {SAMPLE_CALLS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all duration-200 group flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                        {sample.callTitle}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono shrink-0">
                        Score: {sample.scorecard.overallScore}/100
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {sample.coachingCard.executiveSummary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>Load Call</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: PASTE TRANSCRIPT */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Paste Conversation Transcript
                </label>
                <textarea
                  rows={8}
                  value={pastedTranscript}
                  onChange={(e) => setPastedTranscript(e.target.value)}
                  placeholder={`Rep: Hi Marcus, thanks for joining...\nBuyer: Hey Sarah, we looked at your proposal...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Loading Progress feedback */}
          {isLoading && (
            <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
              <div className="text-sm font-semibold text-indigo-200">{loadingStep}</div>
              <p className="text-xs text-indigo-400/80">
                AI Intelligence pipeline running: Audio STT → Diarization → Sentiment Graph → 3-Good / 3-Missed Coaching Card
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
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
              <Sparkles className="w-4 h-4" /> Run Coaching Analysis
            </button>
          )}

          {activeTab === 'record' && (
            <button
              onClick={handleRecordSubmit}
              disabled={!recordedAudioBlob || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Transcribe & Analyze Recording
            </button>
          )}

          {activeTab === 'paste' && (
            <button
              onClick={handlePasteSubmit}
              disabled={!pastedTranscript.trim() || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Analyze Transcript
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
