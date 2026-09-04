import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception in Express Server:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection in Express Server:', reason);
});

app.use(cors({ origin: '*' }));
app.use(express.json());

// API v1 Router Envelope
app.use('/api/v1', routes);

// Root Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AcademiaPro OS Express API', time: new Date().toISOString() });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 AcademiaPro Express API Server running on http://0.0.0.0:${PORT}/api/v1`);
});
