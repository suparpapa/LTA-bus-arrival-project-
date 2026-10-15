import { 
  BusStop, 
  BusArrivalService, 
  NextBusArrival, 
  LiveBusVehicle, 
  BusOperator, 
  BusLoad, 
  BusType,
  SavedBookmark 
} from '../types/bus';
import { SINGAPORE_BUS_STOPS, BUS_SERVICES_CATALOG } from '../data/singaporeBuses';

// Local storage key
const BOOKMARKS_STORAGE_KEY = 'sg_bus_tracker_bookmarks';
const API_CONFIG_STORAGE_KEY = 'sg_bus_tracker_api_config';

export interface ApiConfig {
  mode: 'simulation' | 'backend';
  backendUrl: string;
  ltaApiKey: string;
}

export const defaultApiConfig: ApiConfig = {
  mode: 'simulation',
  backendUrl: '',
  ltaApiKey: '',
};

// Calculate Haversine distance in meters
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Generate realistic Singapore bus plates (SG5821P, SBS3456K, SMB1388S, etc.)
function generateBusPlate(serviceNo: string, index: number, op: BusOperator): string {
  const hash = Math.abs((serviceNo.charCodeAt(0) * 31 + index * 17) % 8999) + 1000;
  const suffix = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'R', 'S', 'T', 'U', 'X', 'Y', 'Z'][hash % 19];
  if (op === 'SBST') return `SBS${hash}${suffix}`;
  if (op === 'SMRT') return `SMB${hash}${suffix}`;
  return `SG${hash}${suffix}`;
}

// Deterministic seed helper
function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export class LtaBusService {
  private static instance: LtaBusService;
  private apiConfig: ApiConfig;

  private constructor() {
    this.apiConfig = this.loadApiConfig();
  }

  public static getInstance(): LtaBusService {
    if (!LtaBusService.instance) {
      LtaBusService.instance = new LtaBusService();
    }
    return LtaBusService.instance;
  }

  public getApiConfig(): ApiConfig {
    return { ...this.apiConfig };
  }

  public saveApiConfig(config: ApiConfig): void {
    this.apiConfig = config;
    try {
      localStorage.setItem(API_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }

  private loadApiConfig(): ApiConfig {
    try {
      const saved = localStorage.getItem(API_CONFIG_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return defaultApiConfig;
  }

  // Get all registered bus stops, optionally sorted by distance from user coordinates
  public getBusStops(userLat?: number, userLng?: number): BusStop[] {
    const stops = SINGAPORE_BUS_STOPS.map((stop) => {
      let distanceMeters: number | undefined = undefined;
      if (userLat !== undefined && userLng !== undefined) {
        distanceMeters = getDistanceMeters(userLat, userLng, stop.latitude, stop.longitude);
      }
      return {
        ...stop,
        distanceMeters,
      };
    });

    if (userLat !== undefined && userLng !== undefined) {
      return stops.sort((a, b) => (a.distanceMeters ?? 999999) - (b.distanceMeters ?? 999999));
    }

    return stops;
  }

  public getBusStopByCode(code: string): BusStop | undefined {
    return SINGAPORE_BUS_STOPS.find((s) => s.busStopCode === code);
  }

  // Search stops or services
  public searchStops(query: string): BusStop[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return this.getBusStops();

    return SINGAPORE_BUS_STOPS.filter((stop) => {
      return (
        stop.busStopCode.toLowerCase().includes(clean) ||
        stop.description.toLowerCase().includes(clean) ||
        stop.roadName.toLowerCase().includes(clean) ||
        stop.services.some((svc) => svc.toLowerCase() === clean) ||
        (stop.mrt && stop.mrt.name.toLowerCase().includes(clean))
      );
    });
  }

  /**
   * Get dynamic real-time arrivals for a bus stop
   * In simulation mode: uses high-fidelity simulation conforming to LTA DataMall v3 BusArrival schema
   * In backend mode: queries the configured backend API
   */
  public async getBusArrivals(busStopCode: string): Promise<BusArrivalService[]> {
    if (this.apiConfig.mode === 'backend' && this.apiConfig.backendUrl) {
      try {
        const url = new URL(this.apiConfig.backendUrl);
        url.searchParams.set('BusStopCode', busStopCode);
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        if (this.apiConfig.ltaApiKey) {
          headers['AccountKey'] = this.apiConfig.ltaApiKey;
        }

        const resp = await fetch(url.toString(), { headers });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.Services) {
            return this.transformLtaResponse(data.Services);
          }
        }
      } catch (err) {
        console.warn('Backend fetch failed, falling back to simulated real-time engine', err);
      }
    }

    // Default: High-fidelity LTA real-time simulation engine
    return this.generateSimulatedArrivals(busStopCode);
  }

  private transformLtaResponse(services: any[]): BusArrivalService[] {
    return services.map((s) => {
      const parseNext = (nb: any): NextBusArrival | null => {
        if (!nb || !nb.EstimatedArrival) return null;
        const arrTime = new Date(nb.EstimatedArrival).getTime();
        const now = Date.now();
        const diffMs = arrTime - now;
        const mins = Math.max(0, Math.round(diffMs / 60000));

        return {
          originCode: nb.OriginCode || '',
          destinationCode: nb.DestinationCode || '',
          estimatedArrival: nb.EstimatedArrival,
          estimatedMinutes: mins,
          latitude: parseFloat(nb.Latitude) || 0,
          longitude: parseFloat(nb.Longitude) || 0,
          visitNumber: parseInt(nb.VisitNumber, 10) || 1,
          load: (nb.Load as BusLoad) || 'SEA',
          feature: (nb.Feature as any) === 'WAB' ? 'WAB' : '',
          type: (nb.Type as BusType) || 'SD',
          vehiclePlate: nb.VehiclePlate || undefined,
          speedKmH: nb.Speed ? parseFloat(nb.Speed) : 32,
        };
      };

      return {
        serviceNo: s.ServiceNo,
        operator: (s.Operator as BusOperator) || 'SBST',
        nextBus: parseNext(s.NextBus),
        nextBus2: parseNext(s.NextBus2),
        nextBus3: parseNext(s.NextBus3),
      };
    });
  }

  // Generate real-time live arrival times aligned to current epoch second
  private generateSimulatedArrivals(busStopCode: string): BusArrivalService[] {
    const stop = this.getBusStopByCode(busStopCode);
    if (!stop) return [];

    const now = Date.now();
    const minutePhase = Math.floor(now / 60000);
    const secondPhase = Math.floor((now % 60000) / 1000);

    return stop.services.map((serviceNo) => {
      const catalog = BUS_SERVICES_CATALOG[serviceNo];
      const operator: BusOperator = catalog?.operator ?? (
        serviceNo.startsWith('8') || serviceNo.startsWith('9') ? 'SMRT' :
        serviceNo === '106' || serviceNo === '857' ? 'TTS' :
        serviceNo === '36' ? 'GAS' : 'SBST'
      );

      // Deterministic cycle per service & stop
      const charSum = serviceNo.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const stopCodeNum = parseInt(busStopCode, 10) || 1234;
      const seedBase = (charSum * 13 + stopCodeNum * 7);

      // Cycle period between 8 and 14 minutes
      const headway = 6 + (seedBase % 7); // e.g. 6 to 12 mins
      const offsetSeconds = (seedBase * 23 + minutePhase * 60 + secondPhase) % (headway * 60);
      
      const nextBusSeconds = (headway * 60) - offsetSeconds;
      const nextBus2Seconds = nextBusSeconds + (headway * 60) - ((seedBase % 3) * 30);
      const nextBus3Seconds = nextBus2Seconds + ((headway + 1) * 60) + ((seedBase % 2) * 45);

      const makeArrival = (secondsLeft: number, idx: number): NextBusArrival => {
        const arrivalEpoch = now + secondsLeft * 1000;
        const minsLeft = Math.floor(secondsLeft / 60);

        // Deterministic attributes
        const seedVal = pseudoRandom(seedBase + idx * 31 + Math.floor(minutePhase / 5));
        
        let load: BusLoad = 'SEA';
        if (seedVal > 0.78) load = 'LSD';
        else if (seedVal > 0.45) load = 'SDA';

        let type: BusType = 'DD';
        if (seedVal < 0.35) type = 'SD';
        else if (seedVal > 0.92 && serviceNo === '190') type = 'BD';

        // Interpolate live bus coordinate along radial approach to bus stop
        const approachAngle = (seedBase % 360) * (Math.PI / 180);
        // Distance roughly proportional to arrival time
        const distOffsetDeg = (secondsLeft / 3600) * 0.04; // ~40km/h
        const busLat = stop.latitude - Math.sin(approachAngle) * distOffsetDeg;
        const busLng = stop.longitude - Math.cos(approachAngle) * distOffsetDeg;

        return {
          originCode: catalog?.origin || 'Interchange',
          destinationCode: catalog?.destination || 'Loop',
          estimatedArrival: new Date(arrivalEpoch).toISOString(),
          estimatedMinutes: minsLeft,
          latitude: Number(busLat.toFixed(5)),
          longitude: Number(busLng.toFixed(5)),
          visitNumber: 1,
          load,
          feature: 'WAB',
          type,
          vehiclePlate: generateBusPlate(serviceNo, idx, operator),
          speedKmH: Math.max(18, Math.min(52, Math.round(35 + Math.sin(secondPhase + idx) * 12))),
        };
      };

      return {
        serviceNo,
        operator,
        nextBus: makeArrival(nextBusSeconds, 1),
        nextBus2: makeArrival(nextBus2Seconds, 2),
        nextBus3: makeArrival(nextBus3Seconds, 3),
      };
    });
  }

  /**
   * Get all live moving buses in Singapore for rendering on map
   */
  public getLiveVehicles(focusedServiceNo?: string, focusedStopCode?: string): LiveBusVehicle[] {
    const stops = SINGAPORE_BUS_STOPS;
    const now = Date.now();
    const secondPhase = Math.floor(now / 1000);
    const vehicles: LiveBusVehicle[] = [];

    stops.forEach((stop) => {
      // If a stop is focused, only generate buses relevant or within radius
      stop.services.forEach((serviceNo, sIdx) => {
        if (focusedServiceNo && focusedServiceNo !== serviceNo) return;

        const catalog = BUS_SERVICES_CATALOG[serviceNo];
        const operator: BusOperator = catalog?.operator || 'SBST';
        const seedBase = serviceNo.charCodeAt(0) * 17 + parseInt(stop.busStopCode, 10);
        
        // 2 vehicles per active service route
        for (let v = 1; v <= 2; v++) {
          const headwaySec = (v === 1 ? 180 : 540) + (seedBase % 120);
          const timeCycle = (secondPhase + seedBase * 10) % headwaySec;
          const ratio = timeCycle / headwaySec; // 0 to 1 progress towards stop

          // Angle of approach
          const angle = ((seedBase * 45 + v * 90) % 360) * (Math.PI / 180);
          const maxDistanceDeg = 0.015; // roughly 1.5km
          const currentDistance = (1 - ratio) * maxDistanceDeg;

          const lat = stop.latitude + Math.cos(angle) * currentDistance;
          const lng = stop.longitude + Math.sin(angle) * currentDistance;

          // Heading pointing roughly towards stop
          const headingDeg = Math.round(((angle + Math.PI) * 180) / Math.PI) % 360;
          const minsAway = Math.max(0, Math.round((1 - ratio) * (headwaySec / 60)));

          vehicles.push({
            id: `BUS_${serviceNo}_${stop.busStopCode}_${v}`,
            serviceNo,
            operator,
            type: v === 1 ? 'DD' : 'SD',
            load: (ratio > 0.6 ? 'SDA' : ratio > 0.85 ? 'LSD' : 'SEA') as BusLoad,
            lat: Number(lat.toFixed(5)),
            lng: Number(lng.toFixed(5)),
            heading: headingDeg,
            speedKmH: Math.round(28 + Math.cos(secondPhase / 5 + v) * 14),
            nextStopCode: stop.busStopCode,
            nextStopName: stop.description,
            plate: generateBusPlate(serviceNo, v, operator),
            estimatedArrivalMin: minsAway,
            direction: 1,
          });
        }
      });
    });

    return vehicles;
  }

  // Saved Bookmarks Manager
  public getBookmarks(): SavedBookmark[] {
    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    // Default initial starter bookmarks for quick delight
    return [
      {
        id: 'bm-1',
        busStopCode: '09048',
        tag: 'Morning',
        customLabel: 'Orchard Lucky Plaza (Work Hub)',
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'bm-2',
        busStopCode: '01112',
        serviceNo: '190',
        tag: 'Evening',
        customLabel: 'Bugis Stn (Express 190)',
        createdAt: Date.now() - 7200000,
      },
      {
        id: 'bm-3',
        busStopCode: '10169',
        tag: 'General',
        customLabel: 'VivoCity / Sentosa Gateway',
        createdAt: Date.now() - 10800000,
      },
    ];
  }

  public saveBookmark(busStopCode: string, serviceNo?: string, tag: 'Morning' | 'Evening' | 'General' = 'General', customLabel?: string): SavedBookmark {
    const list = this.getBookmarks();
    const existing = list.find((b) => b.busStopCode === busStopCode && b.serviceNo === serviceNo);
    if (existing) {
      existing.tag = tag;
      if (customLabel) existing.customLabel = customLabel;
      this.persistBookmarks(list);
      return existing;
    }

    const newBm: SavedBookmark = {
      id: `bm-${Date.now()}`,
      busStopCode,
      serviceNo,
      tag,
      customLabel,
      createdAt: Date.now(),
    };
    list.unshift(newBm);
    this.persistBookmarks(list);
    return newBm;
  }

  public removeBookmark(id: string): void {
    const list = this.getBookmarks().filter((b) => b.id !== id);
    this.persistBookmarks(list);
  }

  public isBookmarked(busStopCode: string, serviceNo?: string): boolean {
    return this.getBookmarks().some((b) => b.busStopCode === busStopCode && (!serviceNo || b.serviceNo === serviceNo));
  }

  private persistBookmarks(bookmarks: SavedBookmark[]): void {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }
}
