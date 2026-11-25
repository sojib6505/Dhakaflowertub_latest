import dotenv from 'dotenv';
import app from './app.js';
import { connectDB, getDBStatus } from './config/db.js';
import { ensureCategories } from './controllers/categoryController.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = () => {
  // Non-blocking background database connection
  connectDB()
    .then(async () => {
      if (!getDBStatus().connected) return;
      // Guarantee the five categories exist without overwriting any admin edits.
      await ensureCategories();
    })
    .catch((err) => {
      console.warn(`[MongoDB Warning] Startup tasks failed: ${err.message}`);
    });

  const server = app.listen(PORT, () => {
    console.log(` Dhaka Flower Tub API running on http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Products API: http://localhost:${PORT}/api/products`);
  });

  return server;
};

startServer();
