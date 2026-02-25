export type Status = 'interested' | 'candidate' | 'approved' | 'discarded';
export type Priority = 'A' | 'B' | 'C';
export type RegretRisk = 'low' | 'medium' | 'high';

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface DiaryEntry {
  id: string;
  date: string;
  text: string;
}

export interface University {
  id: string;
  name: string;
  acronym: string;
  city: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  website: string;
  stemFocus: string[];
  status: Status;
  priority: Priority | null;
  isFavorite: boolean;

  // Monthly costs (€)
  monthlyRent: number;
  monthlyFood: number;
  monthlyTransport: number;
  monthlyPhone: number;
  monthlyAcademic: number;
  monthlyLeisure: number;
  monthlyTravel: number;
  monthlyHealth: number;
  monthlyMisc: number;

  // One-time costs (€)
  flightCost: number;
  visaCost: number;
  housingDeposit: number;
  setupCost: number;
  insuranceCost: number;

  // Income
  scholarship: number;

  // Academic (0-10)
  stemReputation: number;
  researchOpportunities: number;
  englishCourses: number;
  creditCompatibility: number;
  labAccess: number;
  academicIntensity: number;

  // Work (0-10)
  internshipChance: number;
  networkingQuality: number;
  startupEcosystem: number;
  universityJobs: number;

  // Adaptation (0-10)
  languageDifficulty: number; // 10 = very easy
  climateScore: number;
  safety: number;
  qualityOfLife: number;
  internationalCommunity: number;
  publicTransport: number;

  // Personal fit
  emotionalScore: number;
  regretRisk: RegretRisk;

  // Text fields
  language: string;
  climate: string;
  professorOfInterest: string;
  pros: string[];
  cons: string[];
  redFlags: string[];
  notes: string;
  links: string[];

  // Timeline
  applicationDeadline: string;
  visaDeadline: string;
  housingDeadline: string;
  semesterStart: string;
  semesterEnd: string;

  // Checklist
  checklist: ChecklistItem[];

  // Diary
  diary: DiaryEntry[];

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface Weights {
  totalCost: number;
  housing: number;
  stemStrength: number;
  workOpportunities: number;
  languageAdaptation: number;
  qualityOfLife: number;
  climate: number;
  studentLife: number;
  bureaucracyEase: number;
  emotionalFit: number;
}

export interface WeightPreset {
  id: string;
  name: string;
  weights: Weights;
}

export interface ScoreBreakdown {
  costScore: number;
  housingScore: number;
  stemScore: number;
  workScore: number;
  adaptationScore: number;
  qualityScore: number;
  climateScoreVal: number;
  emotionalScoreVal: number;
  finalScore: number;
}

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'application', label: 'Candidatura enviada', completed: false },
  { id: 'docs', label: 'Documentos traduzidos', completed: false },
  { id: 'acceptance', label: 'Carta de aceitação recebida', completed: false },
  { id: 'passport', label: 'Passaporte válido', completed: false },
  { id: 'visa', label: 'Visto solicitado', completed: false },
  { id: 'insurance', label: 'Seguro contratado', completed: false },
  { id: 'housing', label: 'Alojamento confirmado', completed: false },
  { id: 'flight', label: 'Passagem comprada', completed: false },
  { id: 'courses', label: 'Disciplinas aprovadas', completed: false },
  { id: 'financial', label: 'Plano financeiro fechado', completed: false },
  { id: 'bank', label: 'Conta internacional aberta', completed: false },
  { id: 'chip', label: 'Chip/internet internacional', completed: false },
];

export const DEFAULT_WEIGHTS: Weights = {
  totalCost: 8,
  housing: 6,
  stemStrength: 9,
  workOpportunities: 5,
  languageAdaptation: 6,
  qualityOfLife: 7,
  climate: 4,
  studentLife: 5,
  bureaucracyEase: 4,
  emotionalFit: 7,
};
