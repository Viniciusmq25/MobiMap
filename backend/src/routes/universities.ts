import { Router, Request, Response } from 'express';
import { prisma } from '../index';

// Transform UniversityOption from DB format to Frontend format
function transformUniversityOptionToFrontend(data: any) {
  const cost = data.estimatedMonthlyCost || {};
  const academic = data.academicProfile || {};
  const life = data.lifeProfile || {};
  const fit = data.userPreferencesFit || {};

  return {
    id: data.id,
    name: data.universityName || '',
    acronym: data.id.toUpperCase().substring(0, 4),
    city: data.city || '',
    country: data.country || '',
    flag: getCountryFlag(data.countryCode || ''),
    lat: data.latitude || 0,
    lng: data.longitude || 0,
    website: data.websiteUrl || '',
    stemFocus: data.stemFocus || [],
    status: data.status || 'interested',
    priority: data.priorityTag || null,
    isFavorite: false,

    // Monthly costs
    monthlyRent: cost.housing || 0,
    monthlyFood: cost.food || 0,
    monthlyTransport: cost.transport || 0,
    monthlyPhone: cost.internetPhone || 0,
    monthlyAcademic: cost.studyMaterials || 0,
    monthlyLeisure: cost.leisure || 0,
    monthlyTravel: 0,
    monthlyHealth: cost.healthInsurance || 0,
    monthlyMisc: cost.misc || 0,

    // One-time costs
    flightCost: 0,
    visaCost: 0,
    housingDeposit: 0,
    setupCost: 0,
    insuranceCost: 0,

    // Income
    scholarship: 0,

    // Academic
    stemReputation: academic.stemStrengthScore || 5,
    researchOpportunities: academic.researchOpportunityScore || 5,
    englishCourses: 5,
    creditCompatibility: 5,
    labAccess: academic.labInfrastructureScore || 5,
    academicIntensity: 5,

    // Work
    internshipChance: academic.internshipPotentialScore || 5,
    networkingQuality: academic.industryConnectionScore || 5,
    startupEcosystem: 5,
    universityJobs: academic.workOpportunityScore || 5,

    // Adaptation
    languageDifficulty: fit.languageFitScore ? 10 - fit.languageFitScore : 5,
    climateScore: life.climatePreferenceScore || 5,
    safety: life.safetyScore || 5,
    qualityOfLife: life.qualityOfLifeScore || 5,
    internationalCommunity: 5,
    publicTransport: life.publicTransportScore || 5,

    // Personal fit
    emotionalScore: fit.overallFitScore || 5,
    regretRisk: 'low',

    // Text fields
    language: data.languageOfInstruction ? data.languageOfInstruction.join(', ') : '',
    climate: '',
    professorOfInterest: '',
    pros: data.pros || [],
    cons: data.cons || [],
    redFlags: data.redFlags || [],
    notes: data.personalNotes || '',
    links: data.links ? data.links.map((l: any) => l.url) : [],

    // Timeline
    applicationDeadline: data.deadlines?.find((d: any) => d.type === 'application')?.date || '',
    visaDeadline: data.deadlines?.find((d: any) => d.type === 'visa')?.date || '',
    housingDeadline: data.deadlines?.find((d: any) => d.type === 'housing')?.date || '',
    semesterStart: '',
    semesterEnd: '',

    // Checklist
    checklist: data.checklist || [],

    // Diary
    diary: [],

    // Metadata
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

// Helper to get flag emoji from country code
function getCountryFlag(countryCode: string): string {
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
    const transformed = transformUniversityOptionToFrontend(university);
    res.json(transformed);
  } catch (error) {
    console.error('Error fetching university:', error);
    res.status(500).json({ error: 'Failed to fetch university' });
  }
});

// POST /api/universities
universitiesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Auto-calculate total if estimatedMonthlyCost provided without total
    if (data.estimatedMonthlyCost && !data.estimatedMonthlyCost.total) {
      const cost = data.estimatedMonthlyCost;
      cost.total =
        (cost.housing || 0) +
        (cost.food || 0) +
        (cost.transport || 0) +
        (cost.internetPhone || 0) +
        (cost.studyMaterials || 0) +
        (cost.leisure || 0) +
        (cost.healthInsurance || 0) +
        (cost.misc || 0);
    }

    const university = await prisma.universityOption.create({ data });
    res.status(201).json(university);
  } catch (error) {
    console.error('Error creating university:', error);
    res.status(400).json({ error: 'Failed to create university', details: String(error) });
  }
});

// PUT /api/universities/:id (full replace)
universitiesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    if (data.estimatedMonthlyCost && !data.estimatedMonthlyCost.total) {
      const cost = data.estimatedMonthlyCost;
      cost.total =
        (cost.housing || 0) +
        (cost.food || 0) +
        (cost.transport || 0) +
        (cost.internetPhone || 0) +
        (cost.studyMaterials || 0) +
        (cost.leisure || 0) +
        (cost.healthInsurance || 0) +
        (cost.misc || 0);
    }

    const university = await prisma.universityOption.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(university);
  } catch (error) {
    console.error('Error updating university:', error);
    res.status(400).json({ error: 'Failed to update university', details: String(error) });
  }
});

// PATCH /api/universities/:id (partial update)
universitiesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    if (data.estimatedMonthlyCost && !data.estimatedMonthlyCost.total) {
      const cost = data.estimatedMonthlyCost;
      cost.total =
        (cost.housing || 0) +
        (cost.food || 0) +
        (cost.transport || 0) +
        (cost.internetPhone || 0) +
        (cost.studyMaterials || 0) +
        (cost.leisure || 0) +
        (cost.healthInsurance || 0) +
        (cost.misc || 0);
    }

    const university = await prisma.universityOption.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(university);
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
