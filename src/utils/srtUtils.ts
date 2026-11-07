import { SubtitleCue } from '../types/movie';

/**
 * Format decimal seconds to standard SRT timestamp format: HH:MM:SS,mmm
 * Example: 74.32 -> "00:01:14,320"
 */
export function formatSrtTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00,000';
  const totalMs = Math.round(seconds * 1000);
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Format decimal seconds to standard WebVTT timestamp format: HH:MM:SS.mmm
 */
export function formatVttTimestamp(seconds: number): string {
  return formatSrtTimestamp(seconds).replace(',', '.');
}

/**
 * Parse an SRT timestamp (HH:MM:SS,mmm or HH:MM:SS.mmm) into decimal seconds
 */
export function parseSrtTimestamp(ts: string): number {
  if (!ts) return 0;
  const clean = ts.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Calculate Characters Per Second (CPS)
 */
export function calculateCps(text: string, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  const cleanLength = text.trim().length;
  return Math.round((cleanLength / durationSeconds) * 10) / 10;
}

/**
 * Generate standard .SRT file content
 */
export function generateSrtContent(subtitles: SubtitleCue[], includeSpeaker = true): string {
  return subtitles
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .map((cue, idx) => {
      const start = cue.startTime || formatSrtTimestamp(cue.startSeconds);
      const end = cue.endTime || formatSrtTimestamp(cue.endSeconds);
      let textLine = cue.text.trim();
      if (includeSpeaker && cue.speaker && !textLine.startsWith(`[${cue.speaker}]`)) {
        textLine = `[${cue.speaker}] ${textLine}`;
      }
      return `${idx + 1}\n${start} --> ${end}\n${textLine}\n`;
    })
    .join('\n');
}

/**
 * Generate WebVTT file content
 */
export function generateVttContent(subtitles: SubtitleCue[], includeSpeaker = true): string {
  const cues = subtitles
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .map((cue, idx) => {
      const start = (cue.startTime || formatSrtTimestamp(cue.startSeconds)).replace(',', '.');
      const end = (cue.endTime || formatSrtTimestamp(cue.endSeconds)).replace(',', '.');
      let textLine = cue.text.trim();
      if (includeSpeaker && cue.speaker) {
        textLine = `<v ${cue.speaker}>${textLine}`;
      }
      return `${idx + 1}\n${start} --> ${end}\n${textLine}\n`;
    })
    .join('\n');

  return `WEBVTT\n\n${cues}`;
}

/**
 * Parse raw .SRT text content into SubtitleCue array
 */
export function parseSrtContent(rawSrt: string): SubtitleCue[] {
  const blocks = rawSrt.trim().replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  blocks.forEach((block, index) => {
    const lines = block.trim().split('\n');
    if (lines.length >= 2) {
      let timeLineIndex = 1;
      // Handle missing sequence index if first line has timestamps
      if (lines[0].includes('-->')) {
        timeLineIndex = 0;
      }

      const timeLine = lines[timeLineIndex];
      const match = timeLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
      if (match) {
        const startTime = match[1].replace('.', ',');
        const endTime = match[2].replace('.', ',');
        const startSeconds = parseSrtTimestamp(startTime);
        const endSeconds = parseSrtTimestamp(endTime);
        const textLines = lines.slice(timeLineIndex + 1).join(' ');

        // Check for speaker pattern: [Speaker] or Speaker:
        let speaker: string | undefined;
        let cleanText = textLines;

        const speakerMatch = cleanText.match(/^\[([^\]]+)\]\s*(.*)$/) || cleanText.match(/^([^:]+):\s*(.*)$/);
        if (speakerMatch) {
          speaker = speakerMatch[1].trim();
          cleanText = speakerMatch[2].trim();
        }

        const duration = Math.max(0.1, endSeconds - startSeconds);

        cues.push({
          id: `cue-${Date.now()}-${index}`,
          index: index + 1,
          startTime,
          endTime,
          startSeconds,
          endSeconds,
          speaker,
          text: cleanText,
          cps: calculateCps(cleanText, duration),
        });
      }
    }
  });

  return cues;
}

/**
 * Trigger browser file download
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
