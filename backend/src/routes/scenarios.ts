import { Router, Request, Response } from 'express';
import { prisma } from '../index';

export const scenariosRouter = Router();

// GET /api/scenarios
scenariosRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const scenarios = await prisma.decisionScenario.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// POST /api/scenarios
scenariosRouter.post('/', async (req: Request, res: Response) => {
  try {
    const scenario = await prisma.decisionScenario.create({
      data: req.body,
    });
    res.status(201).json(scenario);
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(400).json({ error: 'Failed to create scenario', details: String(error) });
  }
});

// PUT /api/scenarios/:id
scenariosRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const scenario = await prisma.decisionScenario.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json(scenario);
  } catch (error) {
    console.error('Error updating scenario:', error);
    res.status(400).json({ error: 'Failed to update scenario', details: String(error) });
  }
});

// DELETE /api/scenarios/:id
scenariosRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.decisionScenario.delete({
      where: { id: req.params.id as string },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting scenario:', error);
    res.status(400).json({ error: 'Failed to delete scenario', details: String(error) });
  }
});
