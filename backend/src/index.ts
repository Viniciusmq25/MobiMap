import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { universitiesRouter } from './routes/universities';
import { presetsRouter } from './routes/presets';
import { scenariosRouter } from './routes/scenarios';
import { rankingRouter } from './routes/ranking';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/universities', universitiesRouter);
app.use('/api/comparisons/presets', presetsRouter);
app.use('/api/scenarios', scenariosRouter);
app.use('/api/ranking', rankingRouter);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../static')));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../static', 'index.html'));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`MobiMap STEM Backend running on port ${PORT}`);
});
