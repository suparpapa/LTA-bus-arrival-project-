import type { Request, Response } from 'express';

/**
 * Health check endpoint for LTA Datamall serverless integration
 * GET /api/health
 */
export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, x-account-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ltaKeyConfigured = Boolean(
    process.env.LTA_ACCOUNT_KEY || 
    process.env.LTA_DATAMALL_KEY || 
    process.env.ACCOUNT_KEY
  );

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'LTA DataMall Bus Arrival Serverless API',
    endpoints: {
      health: '/api/health',
      busArrival: '/api/busarrival?BusStopCode=:code&ServiceNo=:serviceNo',
    },
    ltaKeyConfigured,
    message: ltaKeyConfigured
      ? 'LTA Datamall AccountKey is loaded in server environment.'
      : 'LTA_ACCOUNT_KEY is not configured yet. Set LTA_ACCOUNT_KEY in your environment variables.',
  });
}
