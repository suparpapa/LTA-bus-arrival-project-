import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import healthHandler from './api/health.ts';
import busArrivalHandler from './api/busarrival.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Serverless API routes
app.all('/api/health', (req, res) => {
  healthHandler(req, res);
});

app.all('/api/busarrival', (req, res) => {
  busArrivalHandler(req, res);
});

// Alias for convenience
app.all('/api/bus-arrival', (req, res) => {
  busArrivalHandler(req, res);
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SG Bus Arrival server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
