import React, { useState, useMemo } from 'react';
import { SubtitleCue } from '../../types/movie';
import {
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Play,
  Search,
  AlertTriangle,
  Clock,
  ArrowRight,
  Split,
  Layers,
  Sparkles,
  Sliders,
  FileCode,
} from 'lucide-react';
import {
  formatSrtTimestamp,
  parseSrtTimestamp,
  calculateCps,
  generateSrtContent,
  generateVttContent,
  downloadFile,
} from '../../utils/srtUtils';

interface SrtSubtitleEditorProps {
  subtitles: SubtitleCue[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  onUpdateSubtitles: (updated: SubtitleCue[]) => void;
  movieTitle: string;
}

export const SrtSubtitleEditor: React.FC<SrtSubtitleEditorProps> = ({
  subtitles,
  currentTime,
  onSeek,
  onUpdateSubtitles,
  movieTitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [timeShiftMs, setTimeShiftMs] = useState<number>(0);
  const [showTimeShiftModal, setShowTimeShiftModal] = useState(false);
  const [includeSpeakerInSrt, setIncludeSpeakerInSrt] = useState(true);

  // Active cue index based on currentTime
  const activeCueIndex = subtitles.findIndex(
    (cue) => currentTime >= cue.startSeconds && currentTime <= cue.endSeconds
  );

  // Filtered cues based on search
  const filteredCues = useMemo(() => {
    if (!searchQuery.trim()) return subtitles;
    const q = searchQuery.toLowerCase();
    return subtitles.filter(
      (c) =>
        c.text.toLowerCase().includes(q) ||
        (c.speaker && c.speaker.toLowerCase().includes(q)) ||
        c.startTime.includes(q)
    );
  }, [subtitles, searchQuery]);

  // Handle single cue change
  const handleCueChange = (id: string, updates: Partial<SubtitleCue>) => {
    const updated = subtitles.map((cue) => {
      if (cue.id === id) {
        const next = { ...cue, ...updates };
        if (updates.startTime) {
          next.startSeconds = parseSrtTimestamp(updates.startTime);
        }
        if (updates.endTime) {
          next.endSeconds = parseSrtTimestamp(updates.endTime);
        }
        const duration = Math.max(0.1, next.endSeconds - next.startSeconds);
        next.cps = calculateCps(next.text, duration);
        return next;
      }
      return cue;
    });
    onUpdateSubtitles(updated);
  };

  // Add new cue after specific index
  const handleAddCue = (index: number) => {
    const prevCue = subtitles[index];
    const newStart = prevCue ? prevCue.endSeconds + 0.3 : 0;
    const newEnd = newStart + 3.0;

    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      index: index + 2,
      startTime: formatSrtTimestamp(newStart),
      endTime: formatSrtTimestamp(newEnd),
      startSeconds: newStart,
      endSeconds: newEnd,
      speaker: prevCue?.speaker || 'Speaker',
      text: 'New subtitle dialogue...',
      cps: 8.0,
    };

    const newSubtitles = [...subtitles];
    newSubtitles.splice(index + 1, 0, newCue);
    // Reindex
    const reindexed = newSubtitles.map((c, i) => ({ ...c, index: i + 1 }));
    onUpdateSubtitles(reindexed);
  };

  // Delete cue
  const handleDeleteCue = (id: string) => {
    const updated = subtitles.filter((c) => c.id !== id).map((c, i) => ({ ...c, index: i + 1 }));
    onUpdateSubtitles(updated);
  };

  // Split cue
  const handleSplitCue = (cue: SubtitleCue) => {
    const midSeconds = (cue.startSeconds + cue.endSeconds) / 2;
    const words = cue.text.split(' ');
    const half = Math.ceil(words.length / 2);
    const text1 = words.slice(0, half).join(' ');
    const text2 = words.slice(half).join(' ');

    const cue1: SubtitleCue = {
      ...cue,
      endTime: formatSrtTimestamp(midSeconds),
      endSeconds: midSeconds,
      text: text1,
      cps: calculateCps(text1, midSeconds - cue.startSeconds),
    };

    const cue2: SubtitleCue = {
      id: `cue-${Date.now()}-split`,
      index: cue.index + 1,
      startTime: formatSrtTimestamp(midSeconds),
      endTime: cue.endTime,
      startSeconds: midSeconds,
      endSeconds: cue.endSeconds,
      speaker: cue.speaker,
      text: text2,
      cps: calculateCps(text2, cue.endSeconds - midSeconds),
    };

    const idx = subtitles.findIndex((c) => c.id === cue.id);
    const updated = [...subtitles];
    updated.splice(idx, 1, cue1, cue2);
    onUpdateSubtitles(updated.map((c, i) => ({ ...c, index: i + 1 })));
  };

  // Download .SRT
  const handleDownloadSrt = () => {
    const srtText = generateSrtContent(subtitles, includeSpeakerInSrt);
    const safeTitle = movieTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'subtitles';
    downloadFile(srtText, `${safeTitle}.en.srt`, 'text/plain;charset=utf-8');
  };

  // Download .VTT
  const handleDownloadVtt = () => {
    const vttText = generateVttContent(subtitles, includeSpeakerInSrt);
    const safeTitle = movieTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'subtitles';
    downloadFile(vttText, `${safeTitle}.en.vtt`, 'text/vtt;charset=utf-8');
  };

  // Copy .SRT
  const handleCopySrt = () => {
    const srtText = generateSrtContent(subtitles, includeSpeakerInSrt);
    navigator.clipboard.writeText(srtText);
    setCopiedFormat('SRT');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Time Shift batch operation
  const applyTimeShift = () => {
    const shiftSeconds = timeShiftMs / 1000;
    const updated = subtitles.map((cue) => {
      const newStart = Math.max(0, cue.startSeconds + shiftSeconds);
      const newEnd = Math.max(newStart + 0.2, cue.endSeconds + shiftSeconds);
      return {
        ...cue,
        startSeconds: newStart,
        endSeconds: newEnd,
        startTime: formatSrtTimestamp(newStart),
        endTime: formatSrtTimestamp(newEnd),
      };
    });
    onUpdateSubtitles(updated);
    setShowTimeShiftModal(false);
    setTimeShiftMs(0);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[700px]">
      {/* Header & Export Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileCode className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-100">
              .SRT Subtitle Studio
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {subtitles.length} cues
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standard SubRip (.srt) English subtitles with live video synchronization.
          </p>
        </div>

        {/* Global Export CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTimeShiftModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            title="Batch offset timestamps forward or backward"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Shift Time</span>
          </button>

          <button
            onClick={handleCopySrt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            {copiedFormat === 'SRT' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SRT</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadVtt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            title="Download WebVTT format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.VTT</span>
          </button>

          <button
            onClick={handleDownloadSrt}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            title="Download standard SubRip English .srt file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .SRT</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Compliance Toggle */}
      <div className="flex items-center gap-3 my-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search dialogue, character name, or timestamp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-colors"
          />
        </div>

        <button
          onClick={() => setIncludeSpeakerInSrt(!includeSpeakerInSrt)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
            includeSpeakerInSrt
              ? 'bg-indigo-950/50 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
          title="Include speaker names [Speaker] inside the exported .srt"
        >
          <span>Speaker in SRT:</span>
          <span className="font-bold">{includeSpeakerInSrt ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Subtitle Cue List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredCues.map((cue, idx) => {
          const isCurrent = activeCueIndex === idx;
          const isCpsHigh = (cue.cps || 0) > 25;

          return (
            <div
              key={cue.id}
              className={`p-3.5 rounded-xl border transition-all duration-150 ${
                isCurrent
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/50'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Cue Header: Index, Timestamps, CPS Warning */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center justify-center">
                    {cue.index}
                  </span>

                  {/* Start & End Timestamps */}
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <input
                      type="text"
                      value={cue.startTime}
                      onChange={(e) => handleCueChange(cue.id, { startTime: e.target.value })}
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-indigo-300 focus:outline-none focus:border-indigo-400"
                    />
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <input
                      type="text"
                      value={cue.endTime}
                      onChange={(e) => handleCueChange(cue.id, { endTime: e.target.value })}
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-indigo-300 focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  {/* Duration readout */}
                  <span className="text-[11px] font-mono text-slate-400">
                    {(cue.endSeconds - cue.startSeconds).toFixed(2)}s
                  </span>
                </div>

                {/* Right Badges & Actions */}
                <div className="flex items-center gap-2">
                  {/* CPS Badge */}
                  <span
                    className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                      isCpsHigh
                        ? 'bg-rose-950/70 text-rose-300 border-rose-700/60'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title={
                      isCpsHigh
                        ? 'CPS exceeds 25 characters per second (Netflix standard warning)'
                        : 'Compliant reading speed'
                    }
                  >
                    {cue.cps || 0} CPS
                  </span>

                  {/* Play this cue */}
                  <button
                    onClick={() => onSeek(cue.startSeconds)}
                    className="p-1 rounded hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 transition-colors"
                    title="Play from cue start"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Split cue */}
                  <button
                    onClick={() => handleSplitCue(cue)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Split into two cues"
                  >
                    <Split className="w-3.5 h-3.5" />
                  </button>

                  {/* Add cue after */}
                  <button
                    onClick={() => handleAddCue(cue.index - 1)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                    title="Add cue after"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete cue */}
                  <button
                    onClick={() => handleDeleteCue(cue.id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete cue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Speaker Input & Subtitle Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Speaker:</span>
                  <input
                    type="text"
                    value={cue.speaker || ''}
                    placeholder="Character Name"
                    onChange={(e) => handleCueChange(cue.id, { speaker: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                  {cue.soundEffect && (
                    <span className="text-[10px] italic text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {cue.soundEffect}
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={cue.text}
                  onChange={(e) => handleCueChange(cue.id, { text: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-sans leading-relaxed focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Shift Modal Dialog */}
      {showTimeShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Batch Time Shift
            </h4>
            <p className="text-xs text-slate-400">
              Offset all subtitle timestamps forward (+) or backward (-) to synchronize with audio.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Offset in milliseconds (ms)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimeShiftMs((prev) => prev - 500)}
                  className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  -500ms
                </button>
                <button
                  onClick={() => setTimeShiftMs((prev) => prev - 250)}
                  className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  -250ms
                </button>
                <input
                  type="number"
                  step="50"
                  value={timeShiftMs}
                  onChange={(e) => setTimeShiftMs(parseInt(e.target.value) || 0)}
                  className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-center font-mono text-white"
                />
                <button
                  onClick={() => setTimeShiftMs((prev) => prev + 250)}
                  className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  +250ms
                </button>
                <button
                  onClick={() => setTimeShiftMs((prev) => prev + 500)}
                  className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  +500ms
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowTimeShiftModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={applyTimeShift}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Apply Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
