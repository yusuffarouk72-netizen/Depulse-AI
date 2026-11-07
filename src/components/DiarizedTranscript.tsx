import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TranscriptUtterance } from '../types/sales';
import {
  Search,
  MessageSquare,
  Play,
  Smile,
  Meh,
  Frown,
  Tag,
  Filter,
  CheckCircle,
  AlertCircle,
  User,
  Headphones,
} from 'lucide-react';

interface DiarizedTranscriptProps {
  transcript: TranscriptUtterance[];
  currentTime: number;
  onSeek: (seconds: number) => void;
}

export const DiarizedTranscript: React.FC<DiarizedTranscriptProps> = ({
  transcript,
  currentTime,
  onSeek,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'rep' | 'prospect'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const activeUtteranceRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine which utterance is currently active based on currentTime
  const activeIndex = useMemo(() => {
    if (!transcript || transcript.length === 0) return -1;
    // Find utterance where timestampSeconds <= currentTime < next timestampSeconds
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (currentTime >= transcript[i].timestampSeconds) {
        return i;
      }
    }
    return 0;
  }, [transcript, currentTime]);

  // Filter transcript
  const filteredTranscript = useMemo(() => {
    return transcript.filter((item) => {
      // Role filter
      if (selectedRole !== 'all' && item.role !== selectedRole) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textMatch = item.text.toLowerCase().includes(q);
        const speakerMatch = item.speakerLabel.toLowerCase().includes(q);
        const tagsMatch = item.tags?.some((t) => t.toLowerCase().includes(q));
        return textMatch || speakerMatch || tagsMatch;
      }
      return true;
    });
  }, [transcript, selectedRole, searchQuery]);

  // Auto scroll to active utterance if enabled
  useEffect(() => {
    if (autoScroll && activeUtteranceRef.current && containerRef.current) {
      activeUtteranceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeIndex, autoScroll]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="w-3.5 h-3.5 text-emerald-400" />;
      case 'negative':
        return <Frown className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Meh className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case 'buying_signal':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'objection':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'discovery':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'pitch':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'closing':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[650px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <MessageSquare className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-100">
              Diarized Speaker Transcript
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              Speaker A vs B
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Turn-by-turn breakdown synced with audio timestamp playback.
          </p>
        </div>

        {/* Speaker Filter Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedRole('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              selectedRole === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({transcript.length})
          </button>
          <button
            onClick={() => setSelectedRole('rep')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              selectedRole === 'rep'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rep (A)
          </button>
          <button
            onClick={() => setSelectedRole('prospect')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              selectedRole === 'prospect'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prospect (B)
          </button>
        </div>
      </div>

      {/* Search Bar & Auto-Scroll Toggle */}
      <div className="flex items-center gap-3 my-3 shrink-0">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search keywords, pricing, objections, competitors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-colors"
          />
        </div>

        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
            autoScroll
              ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Keep view scrolled to current audio playback position"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>Follow Audio</span>
        </button>
      </div>

      {/* Utterance List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        {filteredTranscript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No utterances match your filter criteria.</p>
          </div>
        ) : (
          filteredTranscript.map((utterance, index) => {
            const isCurrentlyPlaying = transcript[activeIndex]?.id === utterance.id;
            const isRep = utterance.role === 'rep';

            return (
              <div
                key={utterance.id || index}
                ref={isCurrentlyPlaying ? activeUtteranceRef : null}
                onClick={() => onSeek(utterance.timestampSeconds)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isCurrentlyPlaying
                    ? isRep
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/40'
                      : 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                    : isRep
                    ? 'bg-slate-950/60 border-slate-800 hover:border-indigo-900/60 hover:bg-slate-950/90'
                    : 'bg-slate-950/60 border-slate-800 hover:border-amber-900/60 hover:bg-slate-950/90'
                }`}
              >
                {/* Speaker Header Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isRep
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isRep ? 'A' : 'B'}
                    </span>
                    <span
                      className={`text-xs font-semibold truncate ${
                        isRep ? 'text-indigo-300' : 'text-amber-300'
                      }`}
                    >
                      {utterance.speakerLabel || (isRep ? 'Speaker A (Rep)' : 'Speaker B (Prospect)')}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${
                        isRep
                          ? 'bg-indigo-950/80 text-indigo-400 border-indigo-800/40'
                          : 'bg-amber-950/80 text-amber-400 border-amber-800/40'
                      }`}
                    >
                      {isRep ? 'Sales Rep' : 'Prospect'}
                    </span>
                  </div>

                  {/* Timestamp & Play Icon */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      {utterance.timestamp}
                    </span>
                  </div>
                </div>

                {/* Spoken Text */}
                <p className="text-sm text-slate-200 leading-relaxed font-normal pl-8">
                  {utterance.text}
                </p>

                {/* Footer: Sentiment + Category Tags */}
                <div className="mt-3 pl-8 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {utterance.category && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border capitalize ${getCategoryBadgeClass(
                          utterance.category
                        )}`}
                      >
                        <Tag className="w-3 h-3" />
                        {utterance.category.replace('_', ' ')}
                      </span>
                    )}

                    {utterance.tags?.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700/50"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      {getSentimentIcon(utterance.sentiment)}
                      <span className="capitalize">{utterance.sentiment}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
