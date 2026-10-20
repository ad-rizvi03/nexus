import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export interface YouTubeRecommendation {
  title: string;
  channel: string;
  url: string;
  description: string;
  duration: string;
}

export interface SuggestedModule {
  title: string;
  description: string;
  estimatedHours: number;
  topics: string[];
}

export interface AiResponse {
  answer: string;
  estimatedDurationMinutes?: number;
  estimatedStudyHours?: number;
  suggestedSubtasks: string[];
  suggestedModules: SuggestedModule[];
  youtubeRecommendations: YouTubeRecommendation[];
  modelUsed: string;
  liveGeminiUsed: boolean;
}

export interface AiRequest {
  prompt: string;
  subject?: string;
  contextType?: 'TASK' | 'ROADMAP' | 'GENERAL';
  apiKey?: string;
}

export interface AiStatusResponse {
  geminiConfigured: boolean;
  model: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/ai';
  private readonly API_KEY_STORAGE = 'nexus_gemini_api_key';

  public readonly DEFAULT_API_KEY = 'AIzaSyAr4GknSEhF61h2Q-_--pV9Alm8XwKVAaE';
  public readonly DEFAULT_MODEL = 'gemini-3.5-flash-lite';
  private readonly CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

  getCustomApiKey(): string {
    return localStorage.getItem(this.API_KEY_STORAGE) || '';
  }

  getEffectiveApiKey(): string {
    const custom = this.getCustomApiKey();
    return custom && custom.trim() ? custom.trim() : this.DEFAULT_API_KEY;
  }

  setCustomApiKey(key: string): void {
    if (key && key.trim()) {
      localStorage.setItem(this.API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(this.API_KEY_STORAGE);
    }
  }

  askAi(prompt: string, subject?: string, contextType: 'TASK' | 'ROADMAP' | 'GENERAL' = 'GENERAL'): Observable<AiResponse> {
    const effectiveKey = this.getEffectiveApiKey();

    if (effectiveKey) {
      return this.askGeminiDirectWithFallback(effectiveKey, prompt, subject, contextType, 0).pipe(
        catchError((err) => {
          console.warn('Direct Gemini API call encountered error, attempting backend real-time proxy:', err);
          return this.askBackendAi(prompt, subject, contextType, effectiveKey);
        })
      );
    }

    return this.askBackendAi(prompt, subject, contextType);
  }

  private askBackendAi(prompt: string, subject?: string, contextType?: 'TASK' | 'ROADMAP' | 'GENERAL', apiKey?: string): Observable<AiResponse> {
    const payload: AiRequest = {
      prompt,
      subject,
      contextType,
      apiKey: apiKey || undefined
    };
    return this.http.post<AiResponse>(`${this.baseUrl}/ask`, payload, { withCredentials: true });
  }

  private askGeminiDirectWithFallback(
    apiKey: string,
    prompt: string,
    subject?: string,
    contextType: 'TASK' | 'ROADMAP' | 'GENERAL' = 'GENERAL',
    modelIndex: number = 0
  ): Observable<AiResponse> {
    const currentModel = this.CANDIDATE_MODELS[modelIndex] || this.DEFAULT_MODEL;

    return this.queryModelDirect(apiKey, currentModel, prompt, subject, contextType).pipe(
      catchError((err) => {
        if (modelIndex + 1 < this.CANDIDATE_MODELS.length) {
          const nextModel = this.CANDIDATE_MODELS[modelIndex + 1];
          console.warn(`Model ${currentModel} failed or busy, trying next candidate: ${nextModel}`, err);
          return this.askGeminiDirectWithFallback(apiKey, prompt, subject, contextType, modelIndex + 1);
        }
        throw err;
      })
    );
  }

  private queryModelDirect(
    apiKey: string,
    modelName: string,
    prompt: string,
    subject?: string,
    contextType: 'TASK' | 'ROADMAP' | 'GENERAL' = 'GENERAL'
  ): Observable<AiResponse> {
    const systemPrompt = `You are an expert technical advisor, productivity copilot, and curriculum designer in Nexus Workspace.
The user is actively creating a task or learning roadmap and searching for real-time guidance.

Context Type: ${contextType}
Subject / Topic: ${subject || 'Technical Topic'}
User Query: "${prompt}"

CRITICAL INSTRUCTIONS:
1. Dynamically tailor your answer and recommendations specifically to the user's EXACT query and subject topic in real time. Never output generic boilerplate or pre-stored data.
2. For time estimation:
   - If TASK: set "estimatedDurationMinutes" with realistic hands-on minutes (e.g. 30, 45, 90, 180) and 3-6 actionable step-by-step checklist items in "suggestedSubtasks".
   - If ROADMAP / COURSE / TECHNOLOGY: set "estimatedStudyHours" with total realistic mastery hours (e.g. 15.0, 30.0, 60.0) and 3-5 structured curriculum modules in "suggestedModules" each with real topics and hours.
3. Curate 3 to 5 of the absolute BEST, high-reputation, real YouTube video courses and tutorials for this topic:
   - "title": Specific real video/course title (e.g. "Kubernetes Tutorial for Beginners [Full Course in 4 Hours]")
   - "channel": Real channel/creator name (e.g. "TechWorld with Nana", "freeCodeCamp.org", "Traversy Media", "Hussein Nasser", "Fireship", "Kunal Kushwaha", "NeetCode", "ByteByteGo")
   - "url": Direct search URL formatted as "https://www.youtube.com/results?search_query=" followed by URL-encoded title and channel name.
   - "description": Concrete summary of what is taught in this video and why it is the best resource for learning.
   - "duration": Estimated runtime (e.g. "3h 40m", "45m", "1h 15m")

Respond strictly with valid JSON conforming to this schema:
{
  "answer": "Comprehensive, clear markdown guidance answering the user's specific query in depth",
  "estimatedDurationMinutes": 45,
  "estimatedStudyHours": 20.0,
  "suggestedSubtasks": ["step 1", "step 2"],
  "suggestedModules": [
    {
      "title": "Module name",
      "description": "Module overview",
      "estimatedHours": 6,
      "topics": ["topic 1", "topic 2"]
    }
  ],
  "youtubeRecommendations": [
    {
      "title": "Real Video Course Title",
      "channel": "Channel Name",
      "url": "https://www.youtube.com/results?search_query=...",
      "description": "Why this video is recommended",
      "duration": "e.g. 2h 30m"
    }
  ]
}`;

    const geminiBody = {
      contents: [
        {
          parts: [
            { text: systemPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    return this.http.post<any>(url, geminiBody).pipe(
      map(res => {
        const text = res?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('No candidate content returned by Gemini API');
        }

        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
        else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);
        const ytList: YouTubeRecommendation[] = (parsed.youtubeRecommendations || []).map((y: any) => {
          let videoUrl = y.url || '';
          if (!videoUrl.startsWith('http')) {
            const query = encodeURIComponent(`${y.title || ''} ${y.channel || ''} tutorial`.trim());
            videoUrl = `https://www.youtube.com/results?search_query=${query}`;
          }
          return {
            title: y.title || 'Video Tutorial',
            channel: y.channel || 'YouTube',
            url: videoUrl,
            description: y.description || '',
            duration: y.duration || ''
          };
        });

        return {
          answer: parsed.answer || '',
          estimatedDurationMinutes: parsed.estimatedDurationMinutes || undefined,
          estimatedStudyHours: parsed.estimatedStudyHours || undefined,
          suggestedSubtasks: parsed.suggestedSubtasks || [],
          suggestedModules: parsed.suggestedModules || [],
          youtubeRecommendations: ytList,
          modelUsed: `Google Gemini (${modelName})`,
          liveGeminiUsed: true
        } as AiResponse;
      })
    );
  }

  getStatus(): Observable<AiStatusResponse> {
    const customKey = this.getCustomApiKey();
    let params = new HttpParams();
    if (customKey) {
      params = params.set('apiKey', customKey);
    }
    return this.http.get<AiStatusResponse>(`${this.baseUrl}/status`, { params, withCredentials: true });
  }
}
