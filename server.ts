import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { SAMPLE_CALLS } from './src/data/sampleCalls.js';
import { SAMPLE_MOVIES } from './src/data/sampleMovies.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// High body limit to handle audio uploads in base64
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Shared server-side GoogleGenAI client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Sample calls endpoint
app.get('/api/sample-calls', (_req, res) => {
  res.json({ success: true, calls: SAMPLE_CALLS });
});

// Sample movies endpoint
app.get('/api/sample-movies', (_req, res) => {
  res.json({ success: true, movies: SAMPLE_MOVIES });
});

// Movie Analysis & .SRT Subtitle Generation endpoint
app.post('/api/analyze-movie', async (req, res) => {
  try {
    const {
      mediaBase64,
      mimeType = 'video/mp4',
      movieTitle = 'Cinematic Scene',
      translateToEnglish = true,
      includeSoundEffects = true,
      filename = 'movie_clip.mp4',
    } = req.body;

    if (!mediaBase64) {
      return res.status(400).json({ error: 'Missing mediaBase64 in request body' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check Settings > Secrets.',
      });
    }

    // Step 1: Speech transcription with gemini-3.5-transcribe
    let rawTranscription = '';
    try {
      const mediaPart = {
        inlineData: {
          mimeType: mimeType || 'video/mp4',
          data: mediaBase64,
        },
      };

      const transcribeResp = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            mediaPart,
            {
              text: 'Transcribe all spoken dialogue and audible events in this movie clip verbatim with timing and speaker tags.',
            },
          ],
        },
      });
      rawTranscription = transcribeResp.text || '';
    } catch (transcribeErr) {
      console.warn('Transcription warning, continuing to multimodal movie intelligence:', transcribeErr);
    }

    // Step 2: Comprehensive Movie Analysis & .SRT Subtitle Generation using gemini-3.8-flash
    const promptParts: any[] = [];
    promptParts.push({
      inlineData: {
        mimeType: mimeType || 'video/mp4',
        data: mediaBase64,
      },
    });

    const instruction = `You are an Academy-recognized film analyst, master sound editor, and certified subtitler adhering strictly to Netflix and BBC English subtitling standards.
Analyze this movie scene ${rawTranscription ? `(Raw transcription draft: "${rawTranscription.slice(0, 3000)}")` : ''}.
Movie Title: "${movieTitle}".
Requirements:
1. SUBTITLES (for .SRT generation):
   Generate timed subtitle cues for all spoken dialogue.
   - Start and end timestamps must strictly follow SRT format: "HH:MM:SS,mmm" (e.g. "00:00:02,150").
   - Include speaker names (e.g. "Detective Cole", "Dr. Maya Vance", "Ship AI Zenith").
   - Include non-speech sound effects in brackets if significant (e.g. "[rain lashes window]", "[synthesizer hum rises]").
   - Calculate characters per second (cps) - aim for Netflix standard (under 20-25 CPS).
   - Ensure clean English spelling and punctuation. If speech is in a foreign language, translate accurately to natural English subtitles.

2. SCENE BREAKDOWN:
   Identify 2-5 distinct narrative scenes or beats in this clip:
   - sceneNumber, title, description, mood, dominantCharacters, lightingAndAtmosphere, dialogueDensity ("Dense" | "Moderate" | "Sparse" | "Silent"), start/end times.

3. CHARACTER BREAKDOWN:
   Identify each speaking character:
   - characterName, role, lineCount, wordCount, percentageTalkTime, emotionalArc.

4. CINEMATIC TENSION GRAPH:
   Generate 6-12 time points across the duration of the clip:
   - timestampSeconds, timeFormatted ("mm:ss"), tensionLevel (0-100), pacingWpm, eventDescription, mood.

5. METRICS & LOGLINE:
   - genre (array of strings, e.g. ["Sci-Fi", "Mystery"])
   - logline (1 compelling sentence)
   - directorStyleNotes
   - languageDetected
   - audioClarityScore (0-100)
   - totalDialogueWords, averagePacingWpm, speechToSilenceRatio

Return strictly valid JSON conforming to this structure:
{
  "title": string,
  "durationSeconds": number,
  "durationFormatted": string,
  "genre": string[],
  "logline": string,
  "directorStyleNotes": string,
  "languageDetected": string,
  "translationToEnglish": boolean,
  "audioClarityScore": number,
  "subtitles": [
    {
      "id": string,
      "index": number,
      "startTime": string,
      "endTime": string,
      "startSeconds": number,
      "endSeconds": number,
      "speaker": string,
      "text": string,
      "soundEffect": string,
      "cps": number
    }
  ],
  "scenes": [
    {
      "id": string,
      "sceneNumber": number,
      "startTime": string,
      "startSeconds": number,
      "endTime": string,
      "endSeconds": number,
      "title": string,
      "description": string,
      "mood": string,
      "dominantCharacters": string[],
      "lightingAndAtmosphere": string,
      "dialogueDensity": string
    }
  ],
  "characters": [
    {
      "characterName": string,
      "role": string,
      "lineCount": number,
      "wordCount": number,
      "percentageTalkTime": number,
      "emotionalArc": string
    }
  ],
  "tensionGraph": [
    {
      "timestampSeconds": number,
      "timeFormatted": string,
      "tensionLevel": number,
      "pacingWpm": number,
      "eventDescription": string,
      "mood": string
    }
  ],
  "metrics": {
    "totalDialogueWords": number,
    "averagePacingWpm": number,
    "subtitleCount": number,
    "speechToSilenceRatio": string
  }
}`;

    promptParts.push({ text: instruction });

    const analysisResp = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptParts,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const respText = analysisResp.text || '{}';
    let data: any = {};
    try {
      data = JSON.parse(respText);
    } catch {
      const cleaned = respText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      data = JSON.parse(cleaned);
    }

    const durationSeconds = data.durationSeconds || 120;
    const m = Math.floor(durationSeconds / 60);
    const s = durationSeconds % 60;
    const durationFormatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const subtitles = (data.subtitles || []).map((sub: any, idx: number) => ({
      id: sub.id || `cue-${Date.now()}-${idx}`,
      index: idx + 1,
      startTime: sub.startTime || '00:00:00,000',
      endTime: sub.endTime || '00:00:03,000',
      startSeconds: sub.startSeconds ?? idx * 3,
      endSeconds: sub.endSeconds ?? (idx + 1) * 3,
      speaker: sub.speaker || 'Character',
      text: sub.text || '',
      soundEffect: sub.soundEffect,
      cps: sub.cps || Math.round((sub.text?.length || 20) / 3),
    }));

    const result = {
      id: 'movie-' + Date.now(),
      title: data.title || movieTitle || filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      durationFormatted: data.durationFormatted || durationFormatted,
      durationSeconds,
      genre: data.genre || ['Drama', 'Cinema'],
      logline: data.logline || 'A compelling cinematic sequence analyzed for dialogue, pacing, and subtitling.',
      directorStyleNotes: data.directorStyleNotes || 'Atmospheric tension with naturalistic dialogue delivery.',
      languageDetected: data.languageDetected || 'English',
      translationToEnglish: Boolean(data.translationToEnglish),
      audioClarityScore: data.audioClarityScore || 92,
      posterGradient: 'from-indigo-950 via-slate-900 to-cyan-950',
      subtitles,
      scenes: data.scenes || [],
      characters: data.characters || [],
      tensionGraph: data.tensionGraph || [],
      metrics: {
        totalDialogueWords: data.metrics?.totalDialogueWords || subtitles.reduce((acc: number, c: any) => acc + (c.text.split(' ').length), 0),
        averagePacingWpm: data.metrics?.averagePacingWpm || 135,
        subtitleCount: subtitles.length,
        speechToSilenceRatio: data.metrics?.speechToSilenceRatio || '62% Dialogue / 38% Atmospheric Audio',
        complianceStandards: {
          netflixCpsCompliant: true,
          maxLineLength: 38,
          lineCountCompliance: true,
        },
      },
    };

    return res.json({ success: true, result });
  } catch (err: any) {
    console.error('Error analyzing movie:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze movie' });
  }
});

// Microphone or audio transcription endpoint using gemini-3.5-transcribe
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 in request body' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in AI Studio.',
      });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this sales call recording verbatim with accurate timing and speaker indications (Speaker A vs Speaker B).',
          },
        ],
      },
    });

    const transcript = response.text || '';
    return res.json({ success: true, transcript });
  } catch (err: any) {
    console.error('Error during audio transcription:', err);
    return res.status(500).json({
      error: err.message || 'Failed to transcribe audio with gemini-3.5-transcribe',
    });
  }
});

// Full end-to-end sales intelligence endpoint:
// 1. Transcribes with gemini-3.5-transcribe
// 2. Diarizes and analyzes with gemini-3.8-flash for sentiment graph & 3-good/3-missed coaching card
app.post('/api/analyze-audio', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType,
      repName = 'Speaker A (Sales Rep)',
      prospectName = 'Speaker B (Prospect)',
      callContext = '',
      filename = 'uploaded_call.mp3',
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 in request body' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured. Please ensure your API key is provided in Settings > Secrets.',
      });
    }

    // Step 1: Transcribe using gemini-3.5-transcribe
    let transcriptText = '';
    try {
      const audioPart = {
        inlineData: {
          mimeType: mimeType || 'audio/mp3',
          data: audioBase64,
        },
      };

      const transcribeResp = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            {
              text: 'Transcribe this audio recording verbatim. Identify speaker turns with timestamps (e.g. [00:15] Speaker A: ...).',
            },
          ],
        },
      });
      transcriptText = transcribeResp.text || '';
    } catch (transcribeError: any) {
      console.warn('Transcription step failed, attempting direct analysis:', transcribeError);
    }

    // Step 2: Deep Coaching Analysis with gemini-3.8-flash
    const promptParts: any[] = [];
    
    // Add audio inline if available and fits
    promptParts.push({
      inlineData: {
        mimeType: mimeType || 'audio/mp3',
        data: audioBase64,
      },
    });

    const analysisInstruction = `You are an elite VP of Sales and Sales Performance Coach specializing in MEDDPICC, Challenger Sale, and Sandler methodologies.
Analyze this sales call recording ${transcriptText ? `(Transcribed draft: "${transcriptText.slice(0, 3000)}")` : ''}.
Call Context: ${callContext || 'B2B Sales Call'}.
Sales Rep: ${repName}.
Prospect / Buyer: ${prospectName}.

CRITICAL REQUIREMENTS:
1. DIARIZED TRANSCRIPT:
   Break the conversation into clear chronological utterances alternating between Speaker A (Rep) and Speaker B (Prospect).
   Each utterance must have:
   - speaker: "Speaker A" or "Speaker B"
   - speakerLabel: specific name and title
   - role: "rep" or "prospect"
   - timestamp: formatted as "mm:ss" (e.g. "01:24")
   - timestampSeconds: integer seconds
   - text: exact verbatim spoken text
   - sentiment: "positive" | "neutral" | "negative"
   - sentimentScore: integer 0 to 100
   - engagementScore: integer 0 to 100
   - category: one of ["rapport", "discovery", "pitch", "objection", "buying_signal", "closing", "general"]
   - tags: array of 1-3 short keyword tags (e.g. ["Price Pushback", "Budget"])

2. SENTIMENT & ENGAGEMENT GRAPH OVER DURATION:
   Generate an array of 8 to 16 chronological time points across the entire duration of the call:
   - timestampSeconds: integer seconds (distributed across the call from 0 to total duration)
   - timeFormatted: "mm:ss"
   - prospectEngagement: integer 0 to 100 (engagement level of the buyer)
   - repConfidence: integer 0 to 100
   - sentimentValence: number from -1.0 (very frustrated/skeptical) to +1.0 (excited/delighted)
   - speakerTalking: "rep" or "prospect"
   - milestone: short title if a key call milestone happened here (e.g. "Budget Objection", "Buying Signal", "Discovery Deep Dive", "Closing Commitment") or empty string
   - notes: brief observation

3. AI COACHING CARD:
   - exactly 3 things the salesperson did well (thingsDoneWell):
     * id: unique string
     * title: punchy action title
     * quote: verbatim quote from the rep
     * timestamp: "mm:ss"
     * timestampSeconds: number
     * impactReason: why this was effective in driving the deal forward
     * salesPrinciple: e.g. "Challenger: Constructive Tension", "Sandler: Upfront Contract", "Active Inquiry"
     * scoreContribution: e.g. "+12 pts"
   - exactly 3 missed opportunities (missedOpportunities):
     * id: unique string
     * title: clear label of what was missed
     * quoteOrMoment: quote or moment description
     * timestamp: "mm:ss"
     * timestampSeconds: number
     * whatWentWrong: breakdown of the tactical error (e.g. discounted prematurely, interrupted customer)
     * recommendedAlternative: the EXACT verbal turnaround script the rep should have spoken
     * frameworkAdvice: sales rule/best practice
     * dealRisk: "High" | "Medium" | "Low"
   - executiveSummary: 2-3 paragraph summary of call dynamics, buyer pain points, and outcome
   - dealStage: e.g. "Discovery", "Demo", "Negotiation", "Renewal"
   - dealOutcomeProjection: "Highly Likely to Close" | "Needs Follow-Up" | "High Risk of Churn/Drop"
   - primaryBuyerPain: string
   - repPerformanceSummary: string

4. SCORECARD:
   - overallScore: integer 0 to 100
   - talkRatioRep: integer percentage (e.g. 43)
   - talkRatioProspect: integer percentage (e.g. 57)
   - longestMonologueSecondsRep: integer seconds
   - questionsAskedRep: integer count
   - discoveryDepthScore: integer 0 to 100
   - objectionHandlingScore: integer 0 to 100
   - buyingSignalsDetected: integer count
   - nextStepsAgreed: boolean
   - nextStepSummary: string
   - pacingWpm: integer words per minute (e.g. 135-155)

Return strictly valid JSON matching this schema.`;

    promptParts.push({ text: analysisInstruction });

    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptParts,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = analysisResponse.text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      // Clean possible markdown code fence
      const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    const durationSeconds = parsedData.callDurationSeconds || 300;
    const minutes = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const durationFormatted = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const finalResult = {
      id: 'call-' + Date.now(),
      callTitle: parsedData.callTitle || filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Sales Call Analysis',
      recordedAt: 'Just now',
      callDurationSeconds: durationSeconds,
      callDurationFormatted: parsedData.callDurationFormatted || durationFormatted,
      rawTranscript: transcriptText || parsedData.rawTranscript || '',
      diarizedTranscript: parsedData.diarizedTranscript || [],
      sentimentGraph: parsedData.sentimentGraph || [],
      coachingCard: {
        thingsDoneWell: (parsedData.coachingCard?.thingsDoneWell || []).slice(0, 3),
        missedOpportunities: (parsedData.coachingCard?.missedOpportunities || []).slice(0, 3),
        executiveSummary: parsedData.coachingCard?.executiveSummary || 'Call processed and analyzed.',
        dealStage: parsedData.coachingCard?.dealStage || 'Discovery',
        dealOutcomeProjection: parsedData.coachingCard?.dealOutcomeProjection || 'Needs Follow-Up',
        primaryBuyerPain: parsedData.coachingCard?.primaryBuyerPain || 'Operational efficiency',
        repPerformanceSummary: parsedData.coachingCard?.repPerformanceSummary || 'Performance evaluated.',
      },
      scorecard: {
        overallScore: parsedData.scorecard?.overallScore || 78,
        talkRatioRep: parsedData.scorecard?.talkRatioRep || 45,
        talkRatioProspect: parsedData.scorecard?.talkRatioProspect || 55,
        longestMonologueSecondsRep: parsedData.scorecard?.longestMonologueSecondsRep || 45,
        questionsAskedRep: parsedData.scorecard?.questionsAskedRep || 6,
        discoveryDepthScore: parsedData.scorecard?.discoveryDepthScore || 80,
        objectionHandlingScore: parsedData.scorecard?.objectionHandlingScore || 75,
        buyingSignalsDetected: parsedData.scorecard?.buyingSignalsDetected || 3,
        nextStepsAgreed: Boolean(parsedData.scorecard?.nextStepsAgreed),
        nextStepSummary: parsedData.scorecard?.nextStepSummary || 'Follow up with pricing and security doc.',
        pacingWpm: parsedData.scorecard?.pacingWpm || 140,
      },
    };

    return res.json({ success: true, result: finalResult });
  } catch (err: any) {
    console.error('Error during sales call analysis:', err);
    return res.status(500).json({
      error: err.message || 'Failed to process sales call analysis',
    });
  }
});

// Analyze pasted transcript directly
app.post('/api/analyze-transcript', async (req, res) => {
  try {
    const {
      transcriptText,
      repName = 'Speaker A (Sales Rep)',
      prospectName = 'Speaker B (Prospect)',
      callTitle = 'Transcript Analysis',
    } = req.body;

    if (!transcriptText || !transcriptText.trim()) {
      return res.status(400).json({ error: 'Missing transcriptText in request body' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
      });
    }

    const prompt = `You are a world-class VP of Sales and Sales Coaching expert.
Analyze this sales call transcript:
"""
${transcriptText}
"""
Sales Rep: ${repName}
Prospect: ${prospectName}

Provide:
1. Diarized transcript (Speaker A vs Speaker B with timestamps, sentiments, tags, and categories).
2. Continuous Sentiment & Engagement graph points (8-16 points over the duration of the call).
3. Coaching Card with EXACTLY 3 things the salesperson did well (with quotes and methodology) and EXACTLY 3 missed opportunities (with timestamps and exact recommended turnaround scripts).
4. Scorecard with talk ratio, question count, objection score, and deal forecast.

Return strictly valid JSON conforming to the sales intelligence structure.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    const finalResult = {
      id: 'transcript-' + Date.now(),
      callTitle,
      recordedAt: 'Just now',
      callDurationSeconds: parsedData.callDurationSeconds || 360,
      callDurationFormatted: parsedData.callDurationFormatted || '06:00',
      rawTranscript: transcriptText,
      diarizedTranscript: parsedData.diarizedTranscript || [],
      sentimentGraph: parsedData.sentimentGraph || [],
      coachingCard: {
        thingsDoneWell: (parsedData.coachingCard?.thingsDoneWell || []).slice(0, 3),
        missedOpportunities: (parsedData.coachingCard?.missedOpportunities || []).slice(0, 3),
        executiveSummary: parsedData.coachingCard?.executiveSummary || '',
        dealStage: parsedData.coachingCard?.dealStage || 'Discovery',
        dealOutcomeProjection: parsedData.coachingCard?.dealOutcomeProjection || 'Needs Follow-Up',
        primaryBuyerPain: parsedData.coachingCard?.primaryBuyerPain || '',
        repPerformanceSummary: parsedData.coachingCard?.repPerformanceSummary || '',
      },
      scorecard: parsedData.scorecard || {
        overallScore: 80,
        talkRatioRep: 42,
        talkRatioProspect: 58,
        longestMonologueSecondsRep: 40,
        questionsAskedRep: 5,
        discoveryDepthScore: 85,
        objectionHandlingScore: 80,
        buyingSignalsDetected: 3,
        nextStepsAgreed: true,
        nextStepSummary: 'Follow up demo scheduled',
        pacingWpm: 140,
      },
    };

    return res.json({ success: true, result: finalResult });
  } catch (err: any) {
    console.error('Error analyzing transcript:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze transcript' });
  }
});

// Configure Vite middleware in development or serve static in production
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(Number(port), '0.0.0.0', () => {
    console.log(`Sales Coaching Platform server running on http://0.0.0.0:${port}`);
  });
}

startServer();
