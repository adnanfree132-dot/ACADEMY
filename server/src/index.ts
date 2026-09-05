import { app } from './app';
import { ensureDefaultAcademy } from './controllers/superAdminController';

const PORT = process.env.PORT || 5000;

app.listen(Number(PORT), '0.0.0.0', async () => {
  console.log(`🚀 AcademiaPro Express API Server running on http://0.0.0.0:${PORT}/api/v1`);
  await ensureDefaultAcademy();
});
