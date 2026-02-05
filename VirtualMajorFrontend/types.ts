
export interface CityResources {
  budget: number;
  trust: number;
  infrastructure: number;
  eco: number;
  population: number;
  innovation: number;
}

export type RegionStatus = 'normal' | 'crisis' | 'growth' | 'protest' | 'epidemic';

export interface Region {
  id: string;
  name: string;
  description: string;
  stats: Partial<CityResources>;
  color: string;
  status: RegionStatus;
  activeIntervention?: string;
}

export interface Investment {
  id: string;
  name: string;
  cost: number;
  description: string;
  impact: Partial<CityResources>;
  tier: 1 | 2 | 3;
  built: boolean;
  currentStep: number;
  totalSteps: number;
  isStarted: boolean;
  regionId?: string; // Проектът може да е локализиран
}

export interface GameEvent {
  title: string;
  description: string;
  type: 'daily' | 'economic' | 'strategic' | 'emergency';
  targetRegion?: string;
  options: EventOption[];
}

export interface EventOption {
  label: string;
  impact: Partial<CityResources>;
  consequence: string;
  regionImpact?: Partial<CityResources>;
}

export interface GameState {
  month: number;
  year: number;
  resources: CityResources;
  taxes: {
    property: number;
    vehicle: number;
    waste: number;
  };
  budgets: {
    culture: number;
    sport: number;
  };
  investments: Investment[];
  availableProjects: Investment[]; // Списък с предложения за покупка
  history: CityResources[];
  consecutiveNegativeBudget: number;
  isGameOver: boolean;
  gameOverReason?: string;
  username?: string;
  logs: string[];
}

export interface AIResponse {
  analysis: string;
  cases: GameEvent[];
  yearlyReport?: string;
  regionUpdates?: Record<string, RegionStatus>;
}
