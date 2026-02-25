import { Router, Request, Response } from 'express';
import { prisma } from '../index';

export const universitiesRouter = Router();

// GET /api/universities
universitiesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const universities = await prisma.universityOption.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    res.json(universities);
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

// GET /api/universities/:id
universitiesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const university = await prisma.universityOption.findUnique({
      where: { id: req.params.id },
    });
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }
    res.json(university);
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
      where: { id: req.params.id },
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
      where: { id: req.params.id },
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
      where: { id: req.params.id },
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
      where: { id: req.params.id },
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
      where: { id: req.params.id },
      data: { checklist },
      select: { id: true, checklist: true },
    });
    res.json({ id: university.id, checklist: university.checklist });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(400).json({ error: 'Failed to update checklist', details: String(error) });
  }
});
