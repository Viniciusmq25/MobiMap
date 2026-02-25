import { Router, Request, Response } from 'express';
import { prisma } from '../index';

export const presetsRouter = Router();

// GET /api/comparisons/presets
presetsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const presets = await prisma.comparisonPreset.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(presets);
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
});

// POST /api/comparisons/presets
presetsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, weights } = req.body;
    if (!name || !weights) {
      return res.status(400).json({ error: 'name and weights are required' });
    }
    const preset = await prisma.comparisonPreset.create({
      data: { name, weights },
    });
    res.status(201).json(preset);
  } catch (error) {
    console.error('Error creating preset:', error);
    res.status(400).json({ error: 'Failed to create preset', details: String(error) });
  }
});

// PUT /api/comparisons/presets/:id
presetsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, weights } = req.body;
    const preset = await prisma.comparisonPreset.update({
      where: { id: req.params.id },
      data: { name, weights },
    });
    res.json(preset);
  } catch (error) {
    console.error('Error updating preset:', error);
    res.status(400).json({ error: 'Failed to update preset', details: String(error) });
  }
});

// DELETE /api/comparisons/presets/:id
presetsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.comparisonPreset.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting preset:', error);
    res.status(400).json({ error: 'Failed to delete preset', details: String(error) });
  }
});
