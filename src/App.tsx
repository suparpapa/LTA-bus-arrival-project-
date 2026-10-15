import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BusStop, BusArrivalService, LiveBusVehicle, SavedBookmark } from './types/bus';
import { LtaBusService, ApiConfig } from './services/ltaBusService';
import { SINGAPORE_BUS_STOPS } from './data/singaporeBuses';
import { TopBar } from './components/TopBar';
import { QuickSearchStrip } from './components/QuickSearchStrip';
import { StopHeaderCard } from './components/StopHeaderCard';
import { BusArrivalCard } from './components/BusArrivalCard';
import { InteractiveMap } from './components/InteractiveMap';
import { RouteDirectoryModal } from './components/RouteDirectoryModal';
import { SavedCommutesModal } from './components/SavedCommutesModal';
import { BackendSettingsModal } from './components/BackendSettingsModal';
import { 
  Bus, 
  MapPin, 
  Layers, 
  Navigation, 
  Clock, 
  Compass, 
  ShieldCheck, 
  RotateCw,
  AlertCircle
} from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = 15;

export default function App() {
  const busService = LtaBusService.getInstance();

  // App State
  const [selectedStop, setSelectedStop] = useState<BusStop>(SINGAPORE_BUS_STOPS[0]); // Default Orchard Lucky Plaza
  const [arrivals, setArrivals] = useState<BusArrivalService[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<LiveBusVehicle[]>([]);
  const [focusedServiceNo, setFocusedServiceNo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BusStop[]>(SINGAPORE_BUS_STOPS);
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(busService.getApiConfig());
  
  // Geolocation state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Timer & Loading state
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(REFRESH_INTERVAL_SECONDS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View state & modals
  const [activeView, setActiveView] = useState<'arrivals' | 'map' | 'routes' | 'saved'>('arrivals');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRoutesOpen, setIsRoutesOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [selectedRouteForModal, setSelectedRouteForModal] = useState<string | null>(null);

  // Mobile sub-tab for main arrivals screen: 'list' or 'map'
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');

  // Load initial bookmarks
  useEffect(() => {
    setBookmarks(busService.getBookmarks());
  }, []);

  // Fetch real-time arrivals for selected bus stop
  const fetchArrivals = useCallback(async (stopCode: string, showIndicator = true) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const data = await busService.getBusArrivals(stopCode);
      setArrivals(data);
      // Also update live vehicles
      const vehicles = busService.getLiveVehicles(focusedServiceNo || undefined, stopCode);
      setLiveVehicles(vehicles);
    } catch (err) {
      console.error('Error fetching arrivals:', err);
    } finally {
      if (showIndicator) setIsRefreshing(false);
      setSecondsUntilRefresh(REFRESH_INTERVAL_SECONDS);
    }
  }, [focusedServiceNo]);

  // Initial & stop change fetch
  useEffect(() => {
    if (selectedStop) {
      fetchArrivals(selectedStop.busStopCode, true);
    }
  }, [selectedStop?.busStopCode, fetchArrivals]);

  // Live countdown timer and vehicle interpolation ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          if (selectedStop) {
            fetchArrivals(selectedStop.busStopCode, false);
          }
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });

      // Continuously update live bus locations smoothly
      if (selectedStop) {
        setLiveVehicles(busService.getLiveVehicles(focusedServiceNo || undefined, selectedStop.busStopCode));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedStop, focusedServiceNo, fetchArrivals]);

  // Search handler
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    const results = busService.searchStops(q);
    setSearchResults(results);

    // If query matches an exact bus stop code, auto-select it
    const exact = SINGAPORE_BUS_STOPS.find((s) => s.busStopCode === q.trim());
    if (exact) {
      setSelectedStop(exact);
    }
  };

  // Select Stop
  const handleSelectStop = (stop: BusStop) => {
    setSelectedStop(stop);
    setSearchQuery('');
    setSearchResults(SINGAPORE_BUS_STOPS);
    // If on mobile map, switch to list to see arrivals
    if (window.innerWidth < 1024) {
      setMobileTab('list');
    }
  };

  const handleSelectStopCode = (code: string) => {
    const found = SINGAPORE_BUS_STOPS.find((s) => s.busStopCode === code);
    if (found) {
      handleSelectStop(found);
    }
  };

  // User Geolocation Finder
  const handleUseGeolocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          
          // Re-sort stops by distance
          const sorted = busService.getBusStops(lat, lng);
          if (sorted.length > 0) {
            setSelectedStop(sorted[0]);
          }
          setIsLocating(false);
        },
        (err) => {
          console.warn('Geolocation denied or unavailable, using Singapore central fallback', err);
          // Fallback: Orchard Road coordinates
          const simulatedLat = 1.3040;
          const simulatedLng = 103.8339;
          setUserCoords({ lat: simulatedLat, lng: simulatedLng });
          const sorted = busService.getBusStops(simulatedLat, simulatedLng);
          if (sorted.length > 0) {
            setSelectedStop(sorted[0]);
          }
          setIsLocating(false);
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Bookmark actions
  const isSelectedStopBookmarked = busService.isBookmarked(selectedStop?.busStopCode || '');
  const handleToggleBookmarkCurrentStop = () => {
    if (!selectedStop) return;
    if (isSelectedStopBookmarked) {
      const match = bookmarks.find((b) => b.busStopCode === selectedStop.busStopCode);
      if (match) {
        busService.removeBookmark(match.id);
        setBookmarks(busService.getBookmarks());
      }
    } else {
      busService.saveBookmark(selectedStop.busStopCode, undefined, 'General', selectedStop.description);
      setBookmarks(busService.getBookmarks());
    }
  };

  const handleAddBookmark = (code: string, tag: 'Morning' | 'Evening' | 'General', label?: string) => {
    busService.saveBookmark(code, undefined, tag, label);
    setBookmarks(busService.getBookmarks());
  };

  const handleRemoveBookmark = (id: string) => {
    busService.removeBookmark(id);
    setBookmarks(busService.getBookmarks());
  };

  // API Config saving
  const handleSaveApiConfig = (cfg: ApiConfig) => {
    busService.saveApiConfig(cfg);
    setApiConfig(cfg);
    if (selectedStop) {
      fetchArrivals(selectedStop.busStopCode, true);
    }
  };

  const handleOpenRouteModal = (svcNo?: string) => {
    setSelectedRouteForModal(svcNo || null);
    setIsRoutesOpen(true);
  };

  // Map focus handler
  const handleFocusBusOnMap = (serviceNo: string) => {
    setFocusedServiceNo(serviceNo);
    if (window.innerWidth < 1024) {
      setMobileTab('map');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Top Bar following contract */}
      <TopBar
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          if (view === 'routes') setIsRoutesOpen(true);
          if (view === 'saved') setIsSavedOpen(true);
          if (view === 'map' && window.innerWidth < 1024) setMobileTab('map');
          if (view === 'arrivals' && window.innerWidth < 1024) setMobileTab('list');
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        savedCount={bookmarks.length}
        apiMode={apiConfig.mode}
      />

      {/* Quick Search Strip */}
      <QuickSearchStrip
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchResults={searchResults}
        onSelectStop={handleSelectStop}
        onUseGeolocation={handleUseGeolocation}
        isLocating={isLocating}
        selectedStopCode={selectedStop?.busStopCode || ''}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4">
        {/* Mobile View Switcher (Only visible on small viewports) */}
        <div className="flex lg:hidden items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setMobileTab('list')}
            className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
              mobileTab === 'list'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Arrivals ({arrivals.length})
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
              mobileTab === 'map'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Live GPS Map ({liveVehicles.length} buses)
          </button>
        </div>

        {/* 2-Column Responsive Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Selected Bus Stop Header & Live Arrival Services Feed */}
          <div className={`lg:col-span-6 xl:col-span-6 space-y-3.5 ${mobileTab === 'map' ? 'hidden lg:block' : 'block'}`}>
            {selectedStop ? (
              <StopHeaderCard
                stop={selectedStop}
                isBookmarked={isSelectedStopBookmarked}
                onToggleBookmark={handleToggleBookmarkCurrentStop}
                secondsUntilRefresh={secondsUntilRefresh}
                onManualRefresh={() => fetchArrivals(selectedStop.busStopCode, true)}
                isRefreshing={isRefreshing}
              />
            ) : null}

            {/* Services Arrivals Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-red-600" />
                  <span>Real-Time Bus Arrivals ({arrivals.length})</span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  LTA DataMall v3 Format
                </div>
              </div>

              {arrivals.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2">
                  <RotateCw className="w-6 h-6 mx-auto animate-spin text-slate-300 dark:text-slate-600" />
                  <p>Querying real-time bus arrivals...</p>
                </div>
              ) : (
                arrivals.map((arr) => (
                  <BusArrivalCard
                    key={arr.serviceNo}
                    arrival={arr}
                    busStopCode={selectedStop.busStopCode}
                    onFocusBusOnMap={handleFocusBusOnMap}
                    onSelectServiceRoute={handleOpenRouteModal}
                  />
                ))
              )}
            </div>

            {/* Information Kicker */}
            <div className="p-3 rounded-xl bg-slate-200/50 dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Synchronized with Land Transport Authority (LTA) headway metrics</span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-[11px] font-semibold text-red-600 hover:underline shrink-0 cursor-pointer"
              >
                API Settings
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive Singapore Map */}
          <div className={`lg:col-span-6 xl:col-span-6 sticky top-20 ${mobileTab === 'list' ? 'hidden lg:block' : 'block'}`}>
            <div className="h-[520px] lg:h-[calc(100vh-140px)] w-full">
              <InteractiveMap
                stops={SINGAPORE_BUS_STOPS}
                selectedStop={selectedStop}
                onSelectStop={handleSelectStop}
                liveVehicles={liveVehicles}
                focusedServiceNo={focusedServiceNo}
                userCoords={userCoords}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      <RouteDirectoryModal
        isOpen={isRoutesOpen}
        onClose={() => setIsRoutesOpen(false)}
        onSelectStopCode={handleSelectStopCode}
        initialServiceNo={selectedRouteForModal}
      />

      <SavedCommutesModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleRemoveBookmark}
        onSelectStopCode={handleSelectStopCode}
        onAddBookmark={handleAddBookmark}
      />

      <BackendSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={apiConfig}
        onSaveConfig={handleSaveApiConfig}
      />
    </div>
  );
}
