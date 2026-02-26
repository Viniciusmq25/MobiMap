import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  University,
  Weights,
  WeightPreset,
  ScoreBreakdown,
  DEFAULT_WEIGHTS,
  DEFAULT_CHECKLIST,
} from '../types';
import { SEED_UNIVERSITIES } from '../data/seedData';

interface AppState {
  universities: University[];
  weights: Weights;
  weightPresets: WeightPreset[];
  compareIds: string[];
}

type Action =
  | { type: 'SET_UNIVERSITIES'; payload: University[] }
  | { type: 'ADD_UNIVERSITY'; payload: University }
  | { type: 'UPDATE_UNIVERSITY'; payload: University }
  | { type: 'DELETE_UNIVERSITY'; payload: string }
  | { type: 'DUPLICATE_UNIVERSITY'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_WEIGHTS'; payload: Weights }
  | { type: 'SAVE_PRESET'; payload: WeightPreset }
  | { type: 'DELETE_PRESET'; payload: string }
  | { type: 'SET_COMPARE_IDS'; payload: string[] }
  | { type: 'TOGGLE_COMPARE'; payload: string };

const initialState: AppState = {
  universities: [],
  weights: DEFAULT_WEIGHTS,
  weightPresets: [
    {
      id: 'cost-focused',
      name: 'Prioridade: Custo',
      weights: { totalCost: 10, housing: 9, stemStrength: 5, workOpportunities: 4, languageAdaptation: 5, qualityOfLife: 5, climate: 3, studentLife: 3, bureaucracyEase: 3, emotionalFit: 5 },
    },
    {
      id: 'stem-focused',
      name: 'Prioridade: STEM',
      weights: { totalCost: 5, housing: 4, stemStrength: 10, workOpportunities: 7, languageAdaptation: 4, qualityOfLife: 5, climate: 3, studentLife: 4, bureaucracyEase: 3, emotionalFit: 6 },
    },
    {
      id: 'career-focused',
      name: 'Prioridade: Carreira',
      weights: { totalCost: 4, housing: 3, stemStrength: 8, workOpportunities: 10, languageAdaptation: 5, qualityOfLife: 5, climate: 2, studentLife: 4, bureaucracyEase: 3, emotionalFit: 5 },
    },
    {
      id: 'balanced',
      name: 'Equilibrado',
      weights: DEFAULT_WEIGHTS,
    },
  ],
  compareIds: [],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_UNIVERSITIES':
      return { ...state, universities: action.payload };
    case 'ADD_UNIVERSITY':
      return { ...state, universities: [...state.universities, action.payload] };
    case 'UPDATE_UNIVERSITY':
      return {
        ...state,
        universities: state.universities.map((u) =>
          u.id === action.payload.id ? action.payload : u
        ),
      };
    case 'DELETE_UNIVERSITY':
      return {
        ...state,
        universities: state.universities.filter((u) => u.id !== action.payload),
        compareIds: state.compareIds.filter((id) => id !== action.payload),
      };
    case 'DUPLICATE_UNIVERSITY': {
      const original = state.universities.find((u) => u.id === action.payload);
      if (!original) return state;
      const newId = `${original.id}-copy-${Date.now()}`;
      const copy: University = {
        ...original,
        id: newId,
        name: `${original.name} (Cópia)`,
        status: 'interested',
        priority: null,
        isFavorite: false,
        diary: [],
        checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { ...state, universities: [...state.universities, copy] };
    }
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        universities: state.universities.map((u) =>
          u.id === action.payload ? { ...u, isFavorite: !u.isFavorite } : u
        ),
      };
    case 'SET_WEIGHTS':
      return { ...state, weights: action.payload };
    case 'SAVE_PRESET':
      return { ...state, weightPresets: [...state.weightPresets, action.payload] };
    case 'DELETE_PRESET':
      return {
        ...state,
        weightPresets: state.weightPresets.filter((p) => p.id !== action.payload),
      };
    case 'SET_COMPARE_IDS':
      return { ...state, compareIds: action.payload };
    case 'TOGGLE_COMPARE': {
      const id = action.payload;
      const current = state.compareIds;
      if (current.includes(id)) {
        return { ...state, compareIds: current.filter((c) => c !== id) };
      }
      if (current.length >= 5) return state;
      return { ...state, compareIds: [...current, id] };
    }
    default:
      return state;
  }
}

// Score calculation utilities
export function calcMonthlyTotal(u: University): number {
  return (
    u.monthlyRent +
    u.monthlyFood +
    u.monthlyTransport +
    u.monthlyPhone +
    u.monthlyAcademic +
    u.monthlyLeisure +
    u.monthlyTravel +
    u.monthlyHealth +
    u.monthlyMisc -
    u.scholarship
  );
}

export function calcOneTimeTotal(u: University): number {
  return u.flightCost + u.visaCost + u.housingDeposit + u.setupCost + u.insuranceCost;
}

export function calcSixMonthTotal(u: University): number {
  return calcMonthlyTotal(u) * 6 + calcOneTimeTotal(u);
}

export function calcScoreBreakdown(
  uni: University,
  allUnis: University[],
  weights: Weights
): ScoreBreakdown {
  const monthlyCosts = allUnis.map((u) => calcMonthlyTotal(u));
  const maxCost = Math.max(...monthlyCosts, 1);
  const minCost = Math.min(...monthlyCosts, 0);
  const range = maxCost - minCost || 1;

  const monthlyCost = calcMonthlyTotal(uni);
  const costScore = Math.max(0, Math.min(10, ((maxCost - monthlyCost) / range) * 10));

  const rents = allUnis.map((u) => u.monthlyRent);
  const maxRent = Math.max(...rents, 1);
  const minRent = Math.min(...rents, 0);
  const rentRange = maxRent - minRent || 1;
  const housingScore = Math.max(0, Math.min(10, ((maxRent - uni.monthlyRent) / rentRange) * 10));

  const stemScore =
    (uni.stemReputation +
      uni.researchOpportunities +
      uni.labAccess +
      uni.creditCompatibility +
      uni.englishCourses) /
    5;

  const workScore =
    (uni.internshipChance + uni.networkingQuality + uni.startupEcosystem + uni.universityJobs) / 4;

  const adaptationScore =
    (uni.languageDifficulty + uni.internationalCommunity + uni.publicTransport) / 3;

  const qualityScore = (uni.safety + uni.qualityOfLife) / 2;
  const climateScoreVal = uni.climateScore;
  const emotionalScoreVal = uni.emotionalScore;
  const studentLifeScore = (uni.internationalCommunity + uni.publicTransport + uni.qualityOfLife) / 3;
  const bureaucracyScore = 7; // simplified

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

  const finalScore =
    (costScore * weights.totalCost +
      housingScore * weights.housing +
      stemScore * weights.stemStrength +
      workScore * weights.workOpportunities +
      adaptationScore * weights.languageAdaptation +
      qualityScore * weights.qualityOfLife +
      climateScoreVal * weights.climate +
      studentLifeScore * weights.studentLife +
      bureaucracyScore * weights.bureaucracyEase +
      emotionalScoreVal * weights.emotionalFit) /
    totalWeight;

  return {
    costScore: Math.round(costScore * 10) / 10,
    housingScore: Math.round(housingScore * 10) / 10,
    stemScore: Math.round(stemScore * 10) / 10,
    workScore: Math.round(workScore * 10) / 10,
    adaptationScore: Math.round(adaptationScore * 10) / 10,
    qualityScore: Math.round(qualityScore * 10) / 10,
    climateScoreVal: Math.round(climateScoreVal * 10) / 10,
    emotionalScoreVal: Math.round(emotionalScoreVal * 10) / 10,
    finalScore: Math.round(finalScore * 10) / 10,
  };
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  calcMonthlyTotal: (u: University) => number;
  calcOneTimeTotal: (u: University) => number;
  calcSixMonthTotal: (u: University) => number;
  calcScoreBreakdown: (u: University) => ScoreBreakdown;
  getRankedUniversities: () => { university: University; breakdown: ScoreBreakdown }[];
  getUpcomingDeadlines: () => { university: University; type: string; date: string; daysLeft: number }[];
  getBadges: (u: University) => string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'mobimap-stem-state';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...init, ...parsed };
      }
    } catch {
      // ignore
    }
    return { ...init, universities: SEED_UNIVERSITIES };
  });

  // Fetch universities from API on mount
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await fetch('/mobimap/api/universities');
        if (response.ok) {
          const universities = await response.json();
          dispatch({ type: 'SET_UNIVERSITIES', payload: universities });
        }
      } catch (error) {
        console.error('Failed to fetch universities from API:', error);
        // Fallback to localStorage/seed data if API fails
      }
    };

    fetchUniversities();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const calcScoreBreakdownBound = useCallback(
    (u: University) => calcScoreBreakdown(u, state.universities, state.weights),
    [state.universities, state.weights]
  );

  const getRankedUniversities = useCallback(() => {
    return state.universities
      .filter((u) => u.status !== 'discarded')
      .map((u) => ({
        university: u,
        breakdown: calcScoreBreakdown(u, state.universities, state.weights),
      }))
      .sort((a, b) => b.breakdown.finalScore - a.breakdown.finalScore);
  }, [state.universities, state.weights]);

  const getUpcomingDeadlines = useCallback(() => {
    const today = new Date();
    const items: { university: University; type: string; date: string; daysLeft: number }[] = [];

    for (const u of state.universities) {
      if (u.status === 'discarded') continue;
      const deadlines = [
        { type: 'Candidatura', date: u.applicationDeadline },
        { type: 'Visto', date: u.visaDeadline },
        { type: 'Alojamento', date: u.housingDeadline },
        { type: 'Início semestre', date: u.semesterStart },
      ];
      for (const d of deadlines) {
        if (!d.date) continue;
        const dt = new Date(d.date);
        const daysLeft = Math.ceil((dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft > -30 && daysLeft < 365) {
          items.push({ university: u, type: d.type, date: d.date, daysLeft });
        }
      }
    }
    return items.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [state.universities]);

  const getBadges = useCallback(
    (u: University): string[] => {
      const badges: string[] = [];
      const unis = state.universities.filter((x) => x.status !== 'discarded');
      if (unis.length < 2) return badges;

      const minCost = Math.min(...unis.map(calcMonthlyTotal));
      if (calcMonthlyTotal(u) === minCost) badges.push('💰 Mais Barato');

      const maxStem = Math.max(...unis.map((x) => x.stemReputation));
      if (u.stemReputation === maxStem) badges.push('🔬 Melhor STEM');

      const maxWork = Math.max(
        ...unis.map((x) => (x.internshipChance + x.networkingQuality + x.startupEcosystem) / 3)
      );
      const workScore = (u.internshipChance + u.networkingQuality + u.startupEcosystem) / 3;
      if (workScore === maxWork) badges.push('💼 Melhor para Carreira');

      const maxQoL = Math.max(...unis.map((x) => x.qualityOfLife));
      if (u.qualityOfLife === maxQoL) badges.push('⭐ Melhor QdV');

      const breakdowns = unis.map((x) => ({
        u: x,
        b: calcScoreBreakdown(x, unis, state.weights),
      }));
      const maxFinal = Math.max(...breakdowns.map((x) => x.b.finalScore));
      const myFinal = calcScoreBreakdown(u, unis, state.weights).finalScore;
      if (myFinal === maxFinal) badges.push('🏆 Melhor Custo-Benefício');

      return badges;
    },
    [state.universities, state.weights]
  );

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        calcMonthlyTotal,
        calcOneTimeTotal,
        calcSixMonthTotal,
        calcScoreBreakdown: calcScoreBreakdownBound,
        getRankedUniversities,
        getUpcomingDeadlines,
        getBadges,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
