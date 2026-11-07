export interface SubtitleCue {
  id: string;
  index: number;
  startTime: string; // "00:00:02,150"
  endTime: string; // "00:00:05,420"
  startSeconds: number; // 2.15
  endSeconds: number; // 5.42
  speaker?: string; // "Commander Hayes"
  text: string; // "Orbital telemetry has detected an anomaly."
  soundEffect?: string; // "[low engine hum]"
  cps?: number; // Characters per second
}

export interface MovieScene {
  id: string;
  sceneNumber: number;
  startTime: string;
  startSeconds: number;
  endTime: string;
  endSeconds: number;
  title: string;
  description: string;
  mood: string; // "Tense", "Mysterious", "Melancholy", "Energetic"
  dominantCharacters: string[];
  lightingAndAtmosphere: string;
  dialogueDensity: 'Dense' | 'Moderate' | 'Sparse' | 'Silent';
}

export interface CharacterDialogueStat {
  characterName: string;
  role: string;
  lineCount: number;
  wordCount: number;
  percentageTalkTime: number;
  emotionalArc: string;
}

export interface TensionPoint {
  timestampSeconds: number;
  timeFormatted: string;
  tensionLevel: number; // 0 to 100
  pacingWpm: number;
  eventDescription: string;
  mood: string;
}

export interface MovieAnalysisResult {
  id: string;
  title: string;
  durationFormatted: string;
  durationSeconds: number;
  genre: string[];
  logline: string;
  directorStyleNotes: string;
  languageDetected: string;
  translationToEnglish: boolean;
  audioClarityScore: number; // 0-100
  subtitles: SubtitleCue[];
  scenes: MovieScene[];
  characters: CharacterDialogueStat[];
  tensionGraph: TensionPoint[];
  metrics: {
    totalDialogueWords: number;
    averagePacingWpm: number;
    subtitleCount: number;
    speechToSilenceRatio: string; // "68% Dialogue / 32% Silence"
    complianceStandards: {
      netflixCpsCompliant: boolean; // <= 20-25 CPS
      maxLineLength: number; // characters
      lineCountCompliance: boolean;
    };
  };
  videoUrl?: string;
  posterGradient?: string;
  isSample?: boolean;
}
