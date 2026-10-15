import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { BusStop, LiveBusVehicle } from '../types/bus';
import { Layers, Crosshair, MapPin, Bus, ZoomIn, ZoomOut } from 'lucide-react';

interface InteractiveMapProps {
  stops: BusStop[];
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  liveVehicles: LiveBusVehicle[];
  focusedServiceNo: string | null;
  userCoords: { lat: number; lng: number } | null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  stops,
  selectedStop,
  onSelectStop,
  liveVehicles,
  focusedServiceNo,
  userCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const stopsLayerRef = useRef<L.LayerGroup | null>(null);
  const vehiclesLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center Singapore (Orchard / Central)
    const initialLat = selectedStop ? selectedStop.latitude : 1.3040;
    const initialLng = selectedStop ? selectedStop.longitude : 103.8339;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean, crisp high-res tiles: CartoDB Positron / Voyager or OSM
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const stopsLayer = L.layerGroup().addTo(map);
    const vehiclesLayer = L.layerGroup().addTo(map);

    stopsLayerRef.current = stopsLayer;
    vehiclesLayerRef.current = vehiclesLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Center map when selected stop changes
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedStop) return;
    mapInstanceRef.current.flyTo([selectedStop.latitude, selectedStop.longitude], 15, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedStop?.busStopCode]);

  // Render Stop Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !stopsLayerRef.current) return;
    stopsLayerRef.current.clearLayers();

    stops.forEach((stop) => {
      const isSelected = selectedStop?.busStopCode === stop.busStopCode;

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-20'}">
          ${isSelected ? '<span class="absolute -inset-1 rounded-full bg-red-500/40 animate-ping-slow"></span>' : ''}
          <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-full shadow-md font-mono text-[10px] font-bold border ${
            isSelected
              ? 'bg-red-600 text-white border-white ring-2 ring-red-500/50'
              : 'bg-white text-slate-900 border-slate-300 hover:border-slate-800'
          }">
            <svg class="w-3 h-3 ${isSelected ? 'text-white' : 'text-red-600'}" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
            </svg>
            <span>${stop.busStopCode}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-stop-marker',
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon: customIcon });

      marker.on('click', () => {
        onSelectStop(stop);
      });

      marker.bindPopup(`
        <div class="text-left font-sans text-xs">
          <div class="font-mono text-[10px] font-bold text-red-400 uppercase tracking-wider">Bus Stop ${stop.busStopCode}</div>
          <div class="font-bold text-white text-sm mt-0.5">${stop.description}</div>
          <div class="text-slate-300 text-[11px] mt-0.5">${stop.roadName}</div>
          <div class="mt-2 text-[10px] text-slate-400">Routes: <span class="font-mono text-slate-200">${stop.services.join(', ')}</span></div>
        </div>
      `);

      stopsLayerRef.current?.addLayer(marker);
    });
  }, [stops, selectedStop?.busStopCode, onSelectStop]);

  // Render Live Moving Vehicles
  useEffect(() => {
    if (!mapInstanceRef.current || !vehiclesLayerRef.current) return;
    vehiclesLayerRef.current.clearLayers();

    liveVehicles.forEach((veh) => {
      const isFocused = focusedServiceNo === veh.serviceNo;
      const loadColor = veh.load === 'SEA' ? '#10b981' : veh.load === 'SDA' ? '#f59e0b' : '#ef4444';

      const busHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform ${isFocused ? 'scale-125 z-40' : 'z-30 hover:scale-110'}">
          <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg shadow-lg font-mono text-xs font-bold border ${
            isFocused
              ? 'bg-red-600 text-white border-white ring-2 ring-red-500'
              : 'bg-slate-900 text-white border-slate-700'
          }">
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${loadColor}"></span>
            <span>${veh.serviceNo}</span>
            <span class="text-[9px] text-slate-400">${veh.type}</span>
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        html: busHtml,
        className: 'custom-bus-marker',
        iconSize: [64, 26],
        iconAnchor: [32, 13],
      });

      const busMarker = L.marker([veh.lat, veh.lng], { icon: busIcon });
      busMarker.bindPopup(`
        <div class="text-left font-sans text-xs">
          <div class="flex items-center justify-between gap-3">
            <span class="font-mono text-sm font-extrabold text-white">Bus ${veh.serviceNo}</span>
            <span class="font-mono text-[10px] text-slate-400">${veh.plate}</span>
          </div>
          <div class="text-[11px] text-slate-300 mt-1">Approaching: <span class="text-white font-medium">${veh.nextStopName}</span></div>
          <div class="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-400">
            <span>Speed: ${veh.speedKmH} km/h</span>
            <span>ETA: ${veh.estimatedArrivalMin} min</span>
          </div>
        </div>
      `);

      vehiclesLayerRef.current?.addLayer(busMarker);
    });
  }, [liveVehicles, focusedServiceNo]);

  // Render User Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userCoords) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      } else {
        const userHtml = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-6 h-6 rounded-full bg-blue-500/30 animate-ping-slow"></span>
            <div class="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
          </div>
        `;
        const userIcon = L.divIcon({
          html: userHtml,
          className: 'user-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(
          mapInstanceRef.current
        );
      }
    }
  }, [userCoords]);

  // Zoom handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleCenterSelectedStop = () => {
    if (selectedStop && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedStop.latitude, selectedStop.longitude], 16);
    }
  };

  const handleFitSingapore = () => {
    if (mapInstanceRef.current) {
      // Fit island of Singapore bounds
      mapInstanceRef.current.flyTo([1.3521, 103.8198], 12);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 shadow-md">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={handleCenterSelectedStop}
            className="px-2.5 py-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            <span>Center Stop</span>
          </button>
          
          <button
            onClick={handleFitSingapore}
            className="px-2.5 py-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Whole Island</span>
          </button>
        </div>

        {/* Legend */}
        <div className="hidden xs:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[11px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-auto">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Seats
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Stand
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Full
          </span>
        </div>
      </div>
    </div>
  );
};
