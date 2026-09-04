import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

export const app = express();

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception in Express Server:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection in Express Server:', reason);
});

app.use(cors({ origin: '*' }));
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  const chunks: Buffer[] = [];
  req.on('data', (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw) {
      req.body = {};
      return next();
    }
    try {
      req.body = JSON.parse(raw);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid JSON body' });
    }
    next();
  });
  req.on('error', next);
});

app.use('/api/v1', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AcademiaPro OS Express API', time: new Date().toISOString() });
});
