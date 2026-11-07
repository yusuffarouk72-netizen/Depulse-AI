import React, { useState } from 'react';
import { MovieAnalysisResult } from '../../types/movie';
import { X, Download, Copy, Check, Printer, FileCode, Film, Layers } from 'lucide-react';
import { generateSrtContent, generateVttContent, downloadFile } from '../../utils/srtUtils';

interface MovieExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: MovieAnalysisResult;
}

export const MovieExportModal: React.FC<MovieExportModalProps> = ({
  isOpen,
  onClose,
  movie,
}) => {
  const [activeTab, setActiveTab] = useState<'srt' | 'vtt' | 'dossier'>('srt');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const srtContent = generateSrtContent(movie.subtitles, true);
  const vttContent = generateVttContent(movie.subtitles, true);

  const generateDossierMarkdown = () => {
    return `# Film Analysis & Subtitle Dossier: ${movie.title}
**Duration:** ${movie.durationFormatted} (${movie.durationSeconds}s)
**Genre:** ${movie.genre.join(', ')}
**Audio Clarity Score:** ${movie.audioClarityScore}/100
**Total Dialogue Words:** ${movie.metrics.totalDialogueWords}
**Average Dialogue Pacing:** ${movie.metrics.averagePacingWpm} WPM
**Language:** ${movie.languageDetected} ${movie.translationToEnglish ? '(Translated to English)' : ''}

---

## 🎬 Logline
> ${movie.logline}

### Director & Cinematography Style Notes
${movie.directorStyleNotes}

---

## 🎭 Scene-by-Scene Breakdown
${movie.scenes
  .map(
    (s) => `### Scene ${s.sceneNumber}: ${s.title} (${s.startTime} - ${s.endTime})
- **Mood:** ${s.mood} | **Dialogue Density:** ${s.dialogueDensity}
- **Dominant Characters:** ${s.dominantCharacters.join(', ')}
- **Cinematography & Atmosphere:** ${s.lightingAndAtmosphere}
- **Description:** ${s.description}
`
  )
  .join('\n')}

---

## 👥 Character Diarization & Speech Distribution
${movie.characters
  .map(
    (c) => `- **${c.characterName}** (${c.role}): ${c.percentageTalkTime}% of dialogue, ${c.lineCount} lines, ${c.wordCount} words.
  *Arc:* ${c.emotionalArc}`
  )
  .join('\n')}

---

## 📝 English SubRip (.SRT) Subtitle Count
Total subtitle cues: ${movie.subtitles.length}
Netflix CPS compliance: ${movie.metrics.complianceStandards.netflixCpsCompliant ? 'PASS (<= 25 CPS)' : 'WARNING (> 25 CPS)'}
`;
  };

  const dossierContent = generateDossierMarkdown();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const safeTitle = movie.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'subtitles';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Subtitles & Movie Analysis</h3>
              <p className="text-xs text-slate-400">
                Industry-standard .SRT, WebVTT, and full film production analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('srt')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'srt'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" /> English Subtitles (.SRT)
          </button>
          <button
            onClick={() => setActiveTab('vtt')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'vtt'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> WebVTT (.VTT)
          </button>
          <button
            onClick={() => setActiveTab('dossier')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'dossier'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" /> Movie Analysis Dossier
          </button>
        </div>

        {/* Body Viewer */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs">
          <textarea
            readOnly
            rows={16}
            value={
              activeTab === 'srt'
                ? srtContent
                : activeTab === 'vtt'
                ? vttContent
                : dossierContent
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 resize-none focus:outline-none scrollbar-thin scrollbar-thumb-slate-800"
          />
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 font-medium transition-colors"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleCopy(
                  activeTab === 'srt'
                    ? srtContent
                    : activeTab === 'vtt'
                    ? vttContent
                    : dossierContent
                )
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>

            {activeTab === 'srt' && (
              <button
                onClick={() =>
                  downloadFile(srtContent, `${safeTitle}.en.srt`, 'text/plain;charset=utf-8')
                }
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> Download .SRT File
              </button>
            )}

            {activeTab === 'vtt' && (
              <button
                onClick={() =>
                  downloadFile(vttContent, `${safeTitle}.en.vtt`, 'text/vtt;charset=utf-8')
                }
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> Download .VTT File
              </button>
            )}

            {activeTab === 'dossier' && (
              <button
                onClick={() =>
                  downloadFile(dossierContent, `${safeTitle}_analysis.md`, 'text/markdown;charset=utf-8')
                }
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> Download Dossier (.md)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
