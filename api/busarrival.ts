import type { Request, Response } from 'express';

const LTA_BUS_ARRIVAL_API = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

/**
 * Serverless endpoint for LTA DataMall Bus Arrival
 * GET /api/busarrival?BusStopCode=83139&ServiceNo=15
 */
export default async function handler(req: Request, res: Response) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, x-account-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are supported',
    });
  }

  // Extract BusStopCode and optional ServiceNo from query parameters
  const busStopCode = (req.query.BusStopCode || req.query.busStopCode || req.query.busstopcode) as string | undefined;
  const serviceNo = (req.query.ServiceNo || req.query.serviceNo || req.query.serviceno) as string | undefined;

  if (!busStopCode) {
    return res.status(400).json({
      error: 'Missing required parameter',
      message: 'BusStopCode query parameter is required (e.g., ?BusStopCode=83139)',
    });
  }

  // Retrieve AccountKey without hardcoding: from process.env or request headers
  const accountKey = (
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    (req.headers['x-account-key'] as string)
  );

  if (!accountKey) {
    return res.status(401).json({
      error: 'LTA AccountKey not configured',
      message: 'Please set the LTA_ACCOUNT_KEY environment variable or pass an AccountKey header.',
      hint: 'Add LTA_ACCOUNT_KEY="<your-key>" in your .env or environment configuration.',
      requestedBusStopCode: busStopCode,
    });
  }

  try {
    const ltaUrl = new URL(LTA_BUS_ARRIVAL_API);
    ltaUrl.searchParams.set('BusStopCode', busStopCode.trim());
    if (serviceNo && serviceNo.trim()) {
      ltaUrl.searchParams.set('ServiceNo', serviceNo.trim());
    }

    const ltaResponse = await fetch(ltaUrl.toString(), {
      method: 'GET',
      headers: {
        'AccountKey': accountKey.trim(),
        'accept': 'application/json',
      },
    });

    if (!ltaResponse.ok) {
      const errorText = await ltaResponse.text();
      return res.status(ltaResponse.status).json({
        error: 'LTA DataMall API responded with an error',
        statusCode: ltaResponse.status,
        statusText: ltaResponse.statusText,
        details: errorText,
      });
    }

    const data = await ltaResponse.json();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(502).json({
      error: 'Failed to communicate with LTA DataMall',
      message: error?.message || 'Unknown network error',
    });
  }
}
