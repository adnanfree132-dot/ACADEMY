import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// API v1 Router Envelope
app.use('/api/v1', routes);

// Root Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AcademiaPro OS Express API', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 AcademiaPro Express API Server running on http://localhost:${PORT}/api/v1`);
});
