import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { attachRequestPrisma } from './prisma';

dotenv.config();

export const app = express();

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception in Express Server:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection in Express Server:', reason);
});

app.use(cors({ origin: '*' }));
app.use(attachRequestPrisma);
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

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'AcademiaPro OS Express API', time: new Date().toISOString() });
});

// JSON fallback for unknown endpoints (preventing Express default HTML 404)
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global Express error handler (preventing Express default HTML error page)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Express Request Error:', err?.message || err);
  const status = typeof err?.status === 'number' ? err.status : 500;
  const message = err?.message || 'Internal Server Error';
  res.status(status).json({ success: false, error: message });
});
