
import { GameState, AIResponse } from "../types";

/**
 * Modernized AI Service that delegates processing to the Spring Boot backend.
 */
export async function processTurn(state: GameState): Promise<AIResponse> {
  try {
    const csrfToken = (window as any).getCsrfToken?.() || (window as any).CSRF_TOKEN;
    const csrfHeader = (window as any).getCsrfHeader?.() || (window as any).CSRF_HEADER || 'X-XSRF-TOKEN';

    const response = await fetch('/api/virtualmajor/process-turn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [csrfHeader]: csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({ gameState: state })
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const result = await response.json();
    return result as AIResponse;
  } catch (error) {
    console.error("Critical AI Error (Backend):", error);
    return {
      analysis: "Общинската администрация работи при засилен натиск. Системите за анализ са временно недостъпни.",
      cases: [{
        title: "Авария на главен колектор",
        description: "Остаряла тръба в Устово се е пукнала, наводнявайки мазетата на няколко жилищни блока. Гражданите са вдигнали протест пред кметството.",
        type: "emergency",
        targetRegion: "ustovo",
        options: [
          {
            label: "Спешна подмяна (120 000 евро)",
            impact: { budget: -120000, infrastructure: 10, trust: 15 },
            consequence: "Аварията е отстранена, хората са доволни."
          },
          {
            label: "Временно изкърпване (20 000 евро)",
            impact: { budget: -20000, trust: -10 },
            consequence: "Проблемът ще се появи пак след месец."
          }
        ]
      }]
    };
  }
}

/**
 * Loads an existing game session from the backend.
 */
export async function loadGame(): Promise<{ hasActiveGame: boolean, gameState?: GameState }> {
  try {
    const response = await fetch('/api/virtualmajor/load-game', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) return { hasActiveGame: false };
      throw new Error(`Backend error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error loading game:", error);
    return { hasActiveGame: false };
  }
}

/**
 * Initializes a new game session on the backend.
 */
export async function createNewGame(): Promise<GameState> {
  const csrfToken = (window as any).getCsrfToken?.() || (window as any).CSRF_TOKEN;
  const csrfHeader = (window as any).getCsrfHeader?.() || (window as any).CSRF_HEADER || 'X-XSRF-TOKEN';

  const response = await fetch('/api/virtualmajor/new-game', {
    method: 'POST',
    headers: {
      [csrfHeader]: csrfToken
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.statusText}`);
  }

  const session = await response.json();
  return session.gameState;
}

/**
 * Interface for the strategic analysis result.
 */
export interface StrategicAnalysis {
  narrative: string;
  achievements: string[];
  warnings: string[];
  history: {
    label: string;
    budget: number;
    trust: number;
    population: number;
  }[];
}

/**
 * Fetches deep strategic analysis from the backend.
 */
export async function fetchStrategicAnalysis(): Promise<StrategicAnalysis> {
  try {
    const response = await fetch('/api/virtualmajor/strategic-analysis', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching strategic analysis:", error);
    throw error;
  }
}
