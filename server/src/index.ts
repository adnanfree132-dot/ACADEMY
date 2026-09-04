import { app } from './app';

const PORT = process.env.PORT || 5000;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 AcademiaPro Express API Server running on http://0.0.0.0:${PORT}/api/v1`);
});
