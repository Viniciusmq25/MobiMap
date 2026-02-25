import { Router, Request, Response } from 'express';
import { prisma } from '../index';

export const rankingRouter = Router();

interface RankingWeights {
  cost: number;
  housing: number;
  stemStrength: number;
  workOpportunity: number;
  adaptation: number;
  qualityOfLife: number;
  studentLife: number;
}

interface MonthlyCost {
  housing?: number;
  food?: number;
  transport?: number;
  internetPhone?: number;
  studyMaterials?: number;
  leisure?: number;
  healthInsurance?: number;
  misc?: number;
  total?: number;
}

interface AcademicProfile {
  stemStrengthScore?: number;
  researchOpportunityScore?: number;
  labInfrastructureScore?: number;
  industryConnectionScore?: number;
  workOpportunityScore?: number;
  internshipPotentialScore?: number;
}

interface LifeProfile {
  qualityOfLifeScore?: number;
  safetyScore?: number;
  studentLifeScore?: number;
  adaptationEaseScore?: number;
  climatePreferenceScore?: number;
  publicTransportScore?: number;
}

function calcMonthlyCostTotal(cost: MonthlyCost): number {
  return (
    (cost.housing || 0) +
    (cost.food || 0) +
    (cost.transport || 0) +
    (cost.internetPhone || 0) +
    (cost.studyMaterials || 0) +
    (cost.leisure || 0) +
    (cost.healthInsurance || 0) +
    (cost.misc || 0)
  );
}

// POST /api/ranking/calculate
rankingRouter.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { weights, universityIds } = req.body as {
      weights: RankingWeights;
      universityIds?: string[];
    };

    if (!weights) {
      return res.status(400).json({ error: 'weights are required' });
    }

    // Fetch universities (optionally filtered)
    const whereClause = universityIds?.length
      ? { id: { in: universityIds } }
      : { status: { not: 'discarded' } };

    const universities = await prisma.universityOption.findMany({ where: whereClause });

    if (universities.length === 0) {
      return res.json({ ranking: [] });
    }

    // Calculate cost scores (normalized: cheaper = higher score)
    const monthlyCosts = universities.map((u) => {
      const cost = u.estimatedMonthlyCost as MonthlyCost;
      return cost.total || calcMonthlyCostTotal(cost);
    });
    const maxCost = Math.max(...monthlyCosts, 1);
    const minCost = Math.min(...monthlyCosts, 0);
    const costRange = maxCost - minCost || 1;

    const housingCosts = universities.map((u) => {
      const cost = u.estimatedMonthlyCost as MonthlyCost;
      return cost.housing || 0;
    });
    const maxHousing = Math.max(...housingCosts, 1);
    const minHousing = Math.min(...housingCosts, 0);
    const housingRange = maxHousing - minHousing || 1;

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

    const ranking = universities.map((uni, idx) => {
      const cost = uni.estimatedMonthlyCost as MonthlyCost;
      const academic = uni.academicProfile as AcademicProfile;
      const life = uni.lifeProfile as LifeProfile;

      // Cost score (inverted: lower cost = higher score, 0-10)
      const monthlyCost = cost.total || calcMonthlyCostTotal(cost);
      const costScore = Math.max(0, Math.min(10, ((maxCost - monthlyCost) / costRange) * 10));

      // Housing score (inverted)
      const housingCost = cost.housing || 0;
      const housingScore = Math.max(
        0,
        Math.min(10, ((maxHousing - housingCost) / housingRange) * 10)
      );

      // STEM strength (average of academic scores)
      const stemScore =
        (
          (academic.stemStrengthScore || 0) +
          (academic.researchOpportunityScore || 0) +
          (academic.labInfrastructureScore || 0)
        ) / 3;

      // Work opportunity
      const workScore =
        (
          (academic.workOpportunityScore || 0) +
          (academic.internshipPotentialScore || 0) +
          (academic.industryConnectionScore || 0)
        ) / 3;

      // Adaptation
      const adaptationScore =
        (
          (life.adaptationEaseScore || 0) +
          (life.publicTransportScore || 0)
        ) / 2;

      // Quality of life
      const qualityScore =
        (
          (life.qualityOfLifeScore || 0) +
          (life.safetyScore || 0)
        ) / 2;

      // Student life
      const studentLifeScore = life.studentLifeScore || 0;

      // Weighted final score
      const finalScore =
        (costScore * weights.cost +
          housingScore * weights.housing +
          stemScore * weights.stemStrength +
          workScore * weights.workOpportunity +
          adaptationScore * weights.adaptation +
          qualityScore * weights.qualityOfLife +
          studentLifeScore * weights.studentLife) /
        totalWeight;

      return {
        universityId: uni.id,
        universityName: uni.universityName,
        country: uni.country,
        countryCode: uni.countryCode,
        city: uni.city,
        status: uni.status,
        priorityTag: uni.priorityTag,
        scores: {
          cost: Math.round(costScore * 10) / 10,
          housing: Math.round(housingScore * 10) / 10,
          stemStrength: Math.round(stemScore * 10) / 10,
          workOpportunity: Math.round(workScore * 10) / 10,
          adaptation: Math.round(adaptationScore * 10) / 10,
          qualityOfLife: Math.round(qualityScore * 10) / 10,
          studentLife: Math.round(studentLifeScore * 10) / 10,
          final: Math.round(finalScore * 10) / 10,
        },
      };
    });

    // Sort by final score descending
    ranking.sort((a, b) => b.scores.final - a.scores.final);

    // Add rank position
    const rankedResults = ranking.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    res.json({ ranking: rankedResults, weights, totalUniversities: universities.length });
  } catch (error) {
    console.error('Error calculating ranking:', error);
    res.status(500).json({ error: 'Failed to calculate ranking', details: String(error) });
  }
});
