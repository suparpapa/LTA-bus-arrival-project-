import React from 'react';
import { Settings, Bookmark, MapPin, Navigation, Bus } from 'lucide-react';

interface TopBarProps {
  activeView: 'arrivals' | 'map' | 'routes' | 'saved';
  onSelectView: (view: 'arrivals' | 'map' | 'routes' | 'saved') => void;
  onOpenSettings: () => void;
  savedCount: number;
  apiMode: 'simulation' | 'backend';
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onSelectView,
  onOpenSettings,
  savedCount,
  apiMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-16">
        {/* Zone 1: Single Brand Wordmark element */}
        <div 
          onClick={() => onSelectView('arrivals')}
          className="flex items-center gap-2.5 cursor-pointer group whitespace-nowrap shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-500/20 group-hover:bg-red-700 transition-colors">
            <Bus className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
              SG BUS <span className="text-red-600">LIVE</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider mt-0.5">
              LTA DATA TRACKER
            </span>
          </div>
        </div>

        {/* Zone 2: 4 Clean Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => onSelectView('arrivals')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'arrivals'
                ? 'text-red-600 font-semibold border-b-2 border-red-600 -mb-[2px]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Live Arrivals
          </button>
          <button
            onClick={() => onSelectView('map')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'map'
                ? 'text-red-600 font-semibold border-b-2 border-red-600 -mb-[2px]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Live GPS Map
          </button>
          <button
            onClick={() => onSelectView('routes')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'routes'
                ? 'text-red-600 font-semibold border-b-2 border-red-600 -mb-[2px]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Route Directory
          </button>
          <button
            onClick={() => onSelectView('saved')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeView === 'saved'
                ? 'text-red-600 font-semibold border-b-2 border-red-600 -mb-[2px]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Saved Commutes</span>
            {savedCount > 0 && (
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Context Action (Backend Config & Status) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 border border-slate-200/80 dark:border-slate-700"
            title="Configure Backend Connection & API Key"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Backend API</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              ({apiMode === 'simulation' ? 'Sim' : 'Live'})
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
