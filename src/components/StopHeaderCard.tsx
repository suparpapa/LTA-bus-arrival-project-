import React from 'react';
import { Bookmark, RefreshCw, Navigation, Train, Clock, Share2, Check } from 'lucide-react';
import { BusStop } from '../types/bus';

interface StopHeaderCardProps {
  stop: BusStop;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  secondsUntilRefresh: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
}

export const StopHeaderCard: React.FC<StopHeaderCardProps> = ({
  stop,
  isBookmarked,
  onToggleBookmark,
  secondsUntilRefresh,
  onManualRefresh,
  isRefreshing,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Singapore Bus Stop ${stop.busStopCode} - ${stop.description} (${stop.roadName})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2.5 py-0.5 rounded-md tracking-wider">
              {stop.busStopCode}
            </span>
            {stop.mrt && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-white px-2 py-0.5 rounded-md"
                style={{ backgroundColor: stop.mrt.color }}
              >
                <Train className="w-3 h-3" />
                {stop.mrt.name} MRT ({stop.mrt.code})
              </span>
            )}
            {stop.distanceMeters !== undefined && (
              <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                <Navigation className="w-3 h-3 text-red-500" />
                {stop.distanceMeters < 1000 ? `${stop.distanceMeters}m` : `${(stop.distanceMeters / 1000).toFixed(1)}km`} away
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {stop.description}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {stop.roadName} · <span className="font-mono">{stop.services.length} active bus routes</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleShare}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Copy stop details"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onToggleBookmark}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isBookmarked ? 'Remove from Saved Stops' : 'Bookmark this bus stop'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Auto-refresh strip */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Auto-refresh in <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">{secondsUntilRefresh}s</span>
          </span>
        </div>

        <button
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 text-red-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};
