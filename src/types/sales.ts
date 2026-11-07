export interface TranscriptUtterance {
  id: string;
  speaker: 'Speaker A' | 'Speaker B';
  speakerLabel: string; // e.g. "Alex (AE)" or "Jordan (Prospect)"
  role: 'rep' | 'prospect';
  timestamp: string; // "00:15"
  timestampSeconds: number; // 15
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // 0 to 100
  engagementScore: number; // 0 to 100
  category?: 'rapport' | 'discovery' | 'pitch' | 'objection' | 'buying_signal' | 'closing' | 'general';
  tags?: string[];
}

export interface SentimentPoint {
  timestampSeconds: number;
  timeFormatted: string;
  prospectEngagement: number; // 0 to 100
  repConfidence: number; // 0 to 100
  sentimentValence: number; // -1.0 (very negative) to +1.0 (very positive)
  speakerTalking: 'rep' | 'prospect';
  milestone?: string;
  notes?: string;
}

export interface CoachingItemGood {
  id: string;
  title: string;
  quote: string;
  timestamp: string;
  timestampSeconds: number;
  impactReason: string;
  salesPrinciple: string; // e.g. "Challenger: Constructive Tension", "Sandler: Upfront Contract", "Active Inquiry"
  scoreContribution: string;
}

export interface CoachingItemMissed {
  id: string;
  title: string;
  quoteOrMoment: string;
  timestamp: string;
  timestampSeconds: number;
  whatWentWrong: string;
  recommendedAlternative: string; // Exact verbal turnaround script
  frameworkAdvice: string; // e.g. "Never negotiate price before securing champion alignment"
  dealRisk: 'High' | 'Medium' | 'Low';
}

export interface CallScorecard {
  overallScore: number; // 0 to 100
  talkRatioRep: number; // e.g. 42
  talkRatioProspect: number; // e.g. 58
  longestMonologueSecondsRep: number;
  questionsAskedRep: number;
  discoveryDepthScore: number; // 0 to 100
  objectionHandlingScore: number; // 0 to 100
  buyingSignalsDetected: number;
  nextStepsAgreed: boolean;
  nextStepSummary: string;
  pacingWpm: number;
}

export interface CoachingCardData {
  thingsDoneWell: CoachingItemGood[]; // exactly 3
  missedOpportunities: CoachingItemMissed[]; // exactly 3
  executiveSummary: string;
  dealStage: string;
  dealOutcomeProjection: 'Highly Likely to Close' | 'Needs Follow-Up' | 'High Risk of Churn/Drop';
  primaryBuyerPain: string;
  repPerformanceSummary: string;
}

export interface CallAnalysisResult {
  id: string;
  callTitle: string;
  recordedAt?: string;
  callDurationSeconds: number;
  callDurationFormatted: string;
  rawTranscript: string;
  diarizedTranscript: TranscriptUtterance[];
  sentimentGraph: SentimentPoint[];
  coachingCard: CoachingCardData;
  scorecard: CallScorecard;
  audioUrl?: string;
  isSample?: boolean;
}
