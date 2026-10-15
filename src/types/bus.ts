/**
 * Singapore LTA Bus Data Definitions & Types
 */

export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusFeature = 'WAB' | ''; // Wheelchair Accessible Bus
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

export interface NextBusArrival {
  originCode: string;
  destinationCode: string;
  estimatedArrival: string; // ISO date string
  estimatedMinutes: number; // e.g. 0 for Arr, 2, 7, etc.
  latitude: number;
  longitude: number;
  visitNumber: number;
  load: BusLoad;
  feature: BusFeature;
  type: BusType;
  vehiclePlate?: string;
  speedKmH?: number;
}

export interface BusArrivalService {
  serviceNo: string;
  operator: BusOperator;
  direction?: 1 | 2;
  nextBus: NextBusArrival | null;
  nextBus2: NextBusArrival | null;
  nextBus3: NextBusArrival | null;
}

export interface MRTConnection {
  code: string; // e.g. "NS22/TE14"
  name: string; // e.g. "Orchard"
  line: string; // e.g. "North-South Line"
  color: string; // e.g. "#d42e12"
}

export interface BusStop {
  busStopCode: string; // 5-digit string e.g. "09048"
  roadName: string;
  description: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  services: string[];
  mrt?: MRTConnection;
}

export interface LiveBusVehicle {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  type: BusType;
  load: BusLoad;
  lat: number;
  lng: number;
  heading: number; // 0 - 360 degrees
  speedKmH: number;
  nextStopCode: string;
  nextStopName: string;
  plate: string;
  estimatedArrivalMin: number;
  direction: 1 | 2;
}

export interface BusRouteStopInfo {
  busStopCode: string;
  stopSequence: number;
  roadName: string;
  description: string;
  distanceKm: number;
  mrt?: MRTConnection;
}

export interface BusServiceDetails {
  serviceNo: string;
  operator: BusOperator;
  category: 'Trunk' | 'Feeder' | 'Express' | 'Night Rider';
  origin: string;
  destination: string;
  firstBusTime: string;
  lastBusTime: string;
  frequencyPeak: string;
  frequencyOffPeak: string;
  stopsDirection1: BusRouteStopInfo[];
  stopsDirection2?: BusRouteStopInfo[];
}

export interface SavedBookmark {
  id: string;
  busStopCode: string;
  serviceNo?: string;
  tag: 'Morning' | 'Evening' | 'General';
  customLabel?: string;
  createdAt: number;
}
