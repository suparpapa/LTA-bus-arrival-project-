import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Crosshair, MapPin, Bus, Train } from 'lucide-react';
import { BusStop } from '../types/bus';
import { POPULAR_LOCATIONS } from '../data/singaporeBuses';

interface QuickSearchStripProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: BusStop[];
  onSelectStop: (stop: BusStop) => void;
  onUseGeolocation: () => void;
  isLocating: boolean;
  selectedStopCode: string;
}

export const QuickSearchStrip: React.FC<QuickSearchStripProps> = ({
  searchQuery,
  onSearchChange,
  searchResults,
  onSelectStop,
  onUseGeolocation,
  isLocating,
  selectedStopCode,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Main Search Input */}
          <div ref={containerRef} className="relative flex-1">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setIsFocused(true);
                }}
                placeholder="Search stop code (e.g. 09048), road name (Orchard Rd), or bus (190)..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-300/80 dark:border-slate-700 focus:border-red-500 dark:focus:border-red-500 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Search Suggestion Dropdown */}
            {isFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching Singapore bus stops or services found for "{searchQuery}".
                  </div>
                ) : (
                  searchResults.slice(0, 8).map((stop) => {
                    const isSelected = stop.busStopCode === selectedStopCode;
                    return (
                      <button
                        key={stop.busStopCode}
                        onClick={() => {
                          onSelectStop(stop);
                          setIsFocused(false);
                        }}
                        className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors ${
                          isSelected ? 'bg-red-50/60 dark:bg-red-950/20' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {stop.busStopCode}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {stop.description}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {stop.roadName} {stop.mrt ? `· MRT: ${stop.mrt.name}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-[10px] text-slate-400 font-mono">
                          <span>{stop.services.length} svcs</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Near Me GPS Geolocation Button */}
          <button
            onClick={onUseGeolocation}
            disabled={isLocating}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700 shrink-0 cursor-pointer disabled:opacity-60"
            title="Locate stops nearest to current position"
          >
            <Crosshair className={`w-3.5 h-3.5 text-red-600 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
          </button>
        </div>

        {/* Quick Transit Hub Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-600" />
            Popular:
          </span>
          {POPULAR_LOCATIONS.map((hub) => {
            const isActive = hub.code === selectedStopCode;
            return (
              <button
                key={hub.code}
                onClick={() => {
                  onSearchChange(hub.code);
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {hub.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
