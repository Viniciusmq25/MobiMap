import { Router, Request, Response } from 'express';
import { prisma } from '../index';

// Transform UniversityOption from DB format to Frontend format
function transformUniversityOptionToFrontend(data: any) {
  const cost = data.estimatedMonthlyCost || {};
  const academic = data.academicProfile || {};
  const life = data.lifeProfile || {};
  const fit = data.userPreferencesFit || {};
  const extra = data.extraData || {};

  return {
    id: data.id,
    name: data.universityName || '',
    acronym: extra.acronym ?? data.id.toUpperCase().substring(0, 4),
    city: data.city || '',
    country: data.country || '',
    flag: getCountryFlag(data.countryCode || ''),
    lat: data.latitude || 0,
    lng: data.longitude || 0,
    website: data.websiteUrl || '',
    stemFocus: data.stemFocus || [],
    status: mapStatus(data.status || 'interested'),
    priority: mapPriorityTag(data.priorityTag),
    isFavorite: extra.isFavorite ?? false,

    // Monthly costs (extra takes priority over cost JSON)
    monthlyRent: cost.housing || 0,
    monthlyFood: cost.food || 0,
    monthlyTransport: cost.transport || 0,
    monthlyPhone: cost.internetPhone || 0,
    monthlyAcademic: cost.studyMaterials || 0,
    monthlyLeisure: cost.leisure || 0,
    monthlyTravel: extra.monthlyTravel ?? 0,
    monthlyHealth: cost.healthInsurance || 0,
    monthlyMisc: cost.misc || 0,

    // One-time costs (stored in extra)
    flightCost: extra.flightCost ?? 0,
    visaCost: extra.visaCost ?? 0,
    housingDeposit: extra.housingDeposit ?? 0,
    setupCost: extra.setupCost ?? 0,
    insuranceCost: extra.insuranceCost ?? 0,

    // Income
    scholarship: extra.scholarship ?? 0,

    // Academic
    stemReputation: academic.stemStrengthScore || 5,
    researchOpportunities: academic.researchOpportunityScore || 5,
    englishCourses: extra.englishCourses ?? 5,
    creditCompatibility: extra.creditCompatibility ?? 5,
    labAccess: academic.labInfrastructureScore || 5,
    academicIntensity: extra.academicIntensity ?? 5,

    // Work
    internshipChance: academic.internshipPotentialScore || 5,
    networkingQuality: academic.industryConnectionScore || 5,
    startupEcosystem: extra.startupEcosystem ?? 5,
    universityJobs: academic.workOpportunityScore || 5,

    // Adaptation
    languageDifficulty: fit.languageFitScore ? 10 - fit.languageFitScore : 5,
    climateScore: life.climatePreferenceScore || 5,
    safety: life.safetyScore || 5,
    qualityOfLife: life.qualityOfLifeScore || 5,
    internationalCommunity: extra.internationalCommunity ?? 5,
    publicTransport: life.publicTransportScore || 5,

    // Personal fit
    emotionalScore: fit.overallFitScore || 5,
    regretRisk: extra.regretRisk ?? 'low',

    // Text fields
    language: data.languageOfInstruction ? data.languageOfInstruction.join(', ') : '',
    climate: extra.climate ?? '',
    professorOfInterest: extra.professorOfInterest ?? '',
    pros: data.pros || [],
    cons: data.cons || [],
    redFlags: data.redFlags || [],
    notes: data.personalNotes || '',
    links: extra.links ?? (data.links ? data.links.map((l: any) => l.url || l) : []),

    // Timeline
    applicationDeadline: data.deadlines?.find((d: any) => d.type === 'application')?.date || '',
    visaDeadline: data.deadlines?.find((d: any) => d.type === 'visa')?.date || '',
    housingDeadline: data.deadlines?.find((d: any) => d.type === 'housing')?.date || '',
    semesterStart: extra.semesterStart ?? '',
    semesterEnd: extra.semesterEnd ?? '',

    // Checklist
    checklist: data.checklist || [],

    // Diary
    diary: extra.diary ?? [],

    // Metadata
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

// Transform Frontend format to DB format
function transformFrontendToBackend(f: any) {
  return {
    universityName: f.name,
    city: f.city,
    country: f.country,
    countryCode: f.countryCode || '',
    latitude: f.lat || 0,
    longitude: f.lng || 0,
    websiteUrl: f.website || '',
    stemFocus: f.stemFocus || [],
    status: f.status || 'interested',
    priorityTag: f.priority || 'B',
    pros: f.pros || [],
    cons: f.cons || [],
    redFlags: f.redFlags || [],
    personalNotes: f.notes || '',
    estimatedMonthlyCost: {
      housing: f.monthlyRent || 0,
      food: f.monthlyFood || 0,
      transport: f.monthlyTransport || 0,
      internetPhone: f.monthlyPhone || 0,
      studyMaterials: f.monthlyAcademic || 0,
      leisure: f.monthlyLeisure || 0,
      healthInsurance: f.monthlyHealth || 0,
      misc: f.monthlyMisc || 0,
      total: (f.monthlyRent || 0) + (f.monthlyFood || 0) + (f.monthlyTransport || 0) +
             (f.monthlyPhone || 0) + (f.monthlyAcademic || 0) + (f.monthlyLeisure || 0) +
             (f.monthlyHealth || 0) + (f.monthlyMisc || 0),
    },
    academicProfile: {
      stemStrengthScore: f.stemReputation || 5,
      researchOpportunityScore: f.researchOpportunities || 5,
      labInfrastructureScore: f.labAccess || 5,
      internshipPotentialScore: f.internshipChance || 5,
      industryConnectionScore: f.networkingQuality || 5,
      workOpportunityScore: f.universityJobs || 5,
    },
    lifeProfile: {
      safetyScore: f.safety || 5,
      qualityOfLifeScore: f.qualityOfLife || 5,
      publicTransportScore: f.publicTransport || 5,
      climatePreferenceScore: f.climateScore || 5,
    },
    userPreferencesFit: {
      languageFitScore: f.languageDifficulty != null ? 10 - f.languageDifficulty : 5,
      overallFitScore: f.emotionalScore || 5,
    },
    languageOfInstruction: f.language ? f.language.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    deadlines: [
      f.applicationDeadline ? { type: 'application', date: f.applicationDeadline } : null,
      f.visaDeadline ? { type: 'visa', date: f.visaDeadline } : null,
      f.housingDeadline ? { type: 'housing', date: f.housingDeadline } : null,
    ].filter(Boolean),
    // Fields with no DB column equivalent go into extraData
    extraData: {
      acronym: f.acronym,
      isFavorite: f.isFavorite,
      monthlyTravel: f.monthlyTravel,
      flightCost: f.flightCost,
      visaCost: f.visaCost,
      housingDeposit: f.housingDeposit,
      setupCost: f.setupCost,
      insuranceCost: f.insuranceCost,
      scholarship: f.scholarship,
      englishCourses: f.englishCourses,
      creditCompatibility: f.creditCompatibility,
      academicIntensity: f.academicIntensity,
      startupEcosystem: f.startupEcosystem,
      internationalCommunity: f.internationalCommunity,
      regretRisk: f.regretRisk,
      climate: f.climate,
      professorOfInterest: f.professorOfInterest,
      semesterStart: f.semesterStart,
      semesterEnd: f.semesterEnd,
      links: f.links,
      diary: f.diary,
    },
  };
}

// Map database status values to frontend Status type
function mapStatus(dbStatus: string): 'interested' | 'candidate' | 'approved' | 'discarded' {
  switch (dbStatus) {
    case 'interested': return 'interested';
    case 'shortlisted':
    case 'applied': return 'candidate';
    case 'accepted':
    case 'chosen': return 'approved';
    case 'rejected':
    case 'discarded': return 'discarded';
    default: return 'interested';
  }
}

// Normalize external priority values to frontend Priority type
function mapPriorityTag(dbPriority: unknown): 'A' | 'B' | 'C' | null {
  if (typeof dbPriority !== 'string') return null;
  const normalized = dbPriority.trim().toUpperCase();
  switch (normalized) {
    case 'A':
    case 'S':
      return 'A';
    case 'B':
      return 'B';
    case 'C':
      return 'C';
    default:
      return null;
  }
}

// Helper to get flag emoji from country code
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export const universitiesRouter = Router();

// GET /api/universities
universitiesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const universities = await prisma.universityOption.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    const transformed = universities.map(transformUniversityOptionToFrontend);
    res.json(transformed);
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

// GET /api/universities/:id
universitiesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const university = await prisma.universityOption.findUnique({
      where: { id: req.params.id as string },
    });
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }
    res.json(transformUniversityOptionToFrontend(university));
  } catch (error) {
    console.error('Error fetching university:', error);
    res.status(500).json({ error: 'Failed to fetch university' });
  }
});

// POST /api/universities — accepts both DB format and frontend format
universitiesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // Detect frontend format by presence of 'name' instead of 'universityName'
    const dbData = data.name ? transformFrontendToBackend(data) : data;

    if (dbData.estimatedMonthlyCost && !dbData.estimatedMonthlyCost.total) {
      const cost = dbData.estimatedMonthlyCost;
      cost.total = (cost.housing || 0) + (cost.food || 0) + (cost.transport || 0) +
        (cost.internetPhone || 0) + (cost.studyMaterials || 0) + (cost.leisure || 0) +
        (cost.healthInsurance || 0) + (cost.misc || 0);
    }

    const university = await prisma.universityOption.create({ data: dbData });
    res.status(201).json(transformUniversityOptionToFrontend(university));
  } catch (error) {
    console.error('Error creating university:', error);
    res.status(400).json({ error: 'Failed to create university', details: String(error) });
  }
});

// PUT /api/universities/:id — accepts both DB format and frontend format
universitiesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const dbData = data.name ? transformFrontendToBackend(data) : data;

    if (dbData.estimatedMonthlyCost && !dbData.estimatedMonthlyCost.total) {
      const cost = dbData.estimatedMonthlyCost;
      cost.total = (cost.housing || 0) + (cost.food || 0) + (cost.transport || 0) +
        (cost.internetPhone || 0) + (cost.studyMaterials || 0) + (cost.leisure || 0) +
        (cost.healthInsurance || 0) + (cost.misc || 0);
    }

    const university = await prisma.universityOption.update({
      where: { id: req.params.id as string },
      data: dbData,
    });
    res.json(transformUniversityOptionToFrontend(university));
  } catch (error) {
    console.error('Error updating university:', error);
    res.status(400).json({ error: 'Failed to update university', details: String(error) });
  }
});

// PATCH /api/universities/:id — accepts both DB format and frontend format
universitiesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const dbData = data.name ? transformFrontendToBackend(data) : data;

    const university = await prisma.universityOption.update({
      where: { id: req.params.id as string },
      data: dbData,
    });
    res.json(transformUniversityOptionToFrontend(university));
  } catch (error) {
    console.error('Error patching university:', error);
    res.status(400).json({ error: 'Failed to patch university', details: String(error) });
  }
});

// DELETE /api/universities/:id
universitiesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.universityOption.delete({
      where: { id: req.params.id as string },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting university:', error);
    res.status(400).json({ error: 'Failed to delete university', details: String(error) });
  }
});

// GET /api/universities/:id/checklist
universitiesRouter.get('/:id/checklist', async (req: Request, res: Response) => {
  try {
    const university = await prisma.universityOption.findUnique({
      where: { id: req.params.id as string },
      select: { id: true, checklist: true },
    });
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }
    res.json({ id: university.id, checklist: university.checklist });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

// PUT /api/universities/:id/checklist
universitiesRouter.put('/:id/checklist', async (req: Request, res: Response) => {
  try {
    const { checklist } = req.body;
    const university = await prisma.universityOption.update({
      where: { id: req.params.id as string },
      data: { checklist },
      select: { id: true, checklist: true },
    });
    res.json({ id: university.id, checklist: university.checklist });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(400).json({ error: 'Failed to update checklist', details: String(error) });
  }
});
