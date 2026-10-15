import React, { useState } from 'react';
import { 
  BusArrivalService, 
  NextBusArrival, 
  BusOperator, 
  BusLoad, 
  BusType 
} from '../types/bus';
import { BUS_SERVICES_CATALOG } from '../data/singaporeBuses';
import { 
  ChevronDown, 
  ChevronUp, 
  Accessibility, 
  Bell, 
  BellRing, 
  MapPin, 
  Gauge, 
  Layers, 
  Info,
  CheckCircle2,
  Navigation
} from 'lucide-react';

interface BusArrivalCardProps {
  arrival: BusArrivalService;
  busStopCode: string;
  onFocusBusOnMap?: (serviceNo: string) => void;
  onSelectServiceRoute?: (serviceNo: string) => void;
}

export const BusArrivalCard: React.FC<BusArrivalCardProps> = ({
  arrival,
  busStopCode,
  onFocusBusOnMap,
  onSelectServiceRoute,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmNotified, setAlarmNotified] = useState(false);

  const catalog = BUS_SERVICES_CATALOG[arrival.serviceNo];

  // Operator visual colors
  const getOperatorStyle = (op: BusOperator) => {
    switch (op) {
      case 'SBST':
        return 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800';
      case 'SMRT':
        return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
      case 'TTS':
        return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      case 'GAS':
        return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
      default:
        return 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  // Capacity / Load styling
  const getLoadConfig = (load: BusLoad) => {
    switch (load) {
      case 'SEA':
        return {
          label: 'Seats Available',
          shortLabel: 'Seats',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          bgBar: 'bg-emerald-500',
        };
      case 'SDA':
        return {
          label: 'Standing Available',
          shortLabel: 'Standing',
          textColor: 'text-amber-600 dark:text-amber-400',
          bgBar: 'bg-amber-500',
        };
      case 'LSD':
        return {
          label: 'Limited Standing',
          shortLabel: 'Full / Crowded',
          textColor: 'text-rose-600 dark:text-rose-400',
          bgBar: 'bg-rose-500',
        };
    }
  };

  // Helper for single arrival slot
  const renderArrivalPill = (nb: NextBusArrival | null, label: string, isNextBus = false) => {
    if (!nb) {
      return (
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 text-center min-w-[70px]">
          <span className="text-[10px] text-slate-400 uppercase font-mono">{label}</span>
          <span className="text-xs text-slate-400 font-mono mt-0.5">--</span>
        </div>
      );
    }

    const loadConfig = getLoadConfig(nb.load);
    const isArriving = nb.estimatedMinutes <= 0;

    return (
      <div 
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border min-w-[80px] sm:min-w-[92px] ${
          isNextBus 
            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs' 
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
        }`}
      >
        <span className={`text-[10px] uppercase font-mono tracking-wider ${isNextBus ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
          {label}
        </span>

        {/* Minutes display */}
        <div className="flex items-baseline gap-0.5 my-0.5">
          {isArriving ? (
            <span className={`text-base sm:text-lg font-extrabold tracking-tight ${isNextBus ? 'text-emerald-400 dark:text-emerald-600 font-mono' : 'text-emerald-600 dark:text-emerald-400 font-mono'}`}>
              Arr
            </span>
          ) : (
            <>
              <span className="text-base sm:text-lg font-extrabold font-mono tabular-nums leading-none">
                {nb.estimatedMinutes}
              </span>
              <span className={`text-[10px] font-medium ${isNextBus ? 'text-slate-300 dark:text-slate-500' : 'text-slate-500'}`}>
                m
              </span>
            </>
          )}
        </div>

        {/* Deck and Load indicator */}
        <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
          {/* Deck type */}
          <span className={`font-mono font-bold text-[9px] px-1 py-0.2 rounded ${
            isNextBus 
              ? 'bg-white/20 dark:bg-slate-900/10 text-white dark:text-slate-900' 
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {nb.type === 'DD' ? 'DD 2-Deck' : nb.type === 'BD' ? 'Bendy' : 'SD'}
          </span>

          {/* Load indicator bar */}
          <span 
            className={`w-2 h-2 rounded-full ${loadConfig.bgBar}`} 
            title={`${loadConfig.label}`} 
          />
        </div>
      </div>
    );
  };

  const handleToggleAlarm = () => {
    if (alarmActive) {
      setAlarmActive(false);
      setAlarmNotified(false);
    } else {
      setAlarmActive(true);
      // Play a subtle notification tone using Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch {
        // audio context blocked or not supported
      }

      // If next bus is already <= 2 min, trigger notification immediately
      if (arrival.nextBus && arrival.nextBus.estimatedMinutes <= 2) {
        setAlarmNotified(true);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all shadow-xs hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Service Number & Route Info */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[64px] text-center">
              {arrival.serviceNo}
            </span>
            <span className={`text-[10px] font-mono font-bold mt-1 px-1.5 py-0.5 rounded border ${getOperatorStyle(arrival.operator)}`}>
              {arrival.operator}
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>to</span>
              <span className="text-slate-900 dark:text-white font-bold truncate max-w-[140px] sm:max-w-[200px]">
                {catalog?.destination || 'Destination'}
              </span>
            </div>
            
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {catalog?.category || 'Trunk'} Service · Freq: {catalog?.frequencyPeak || '6-10m'}
            </div>

            {arrival.nextBus && (
              <div className="flex items-center gap-2 text-[11px] mt-1">
                <span className={`font-medium ${getLoadConfig(arrival.nextBus.load).textColor}`}>
                  ● {getLoadConfig(arrival.nextBus.load).label}
                </span>
                {arrival.nextBus.feature === 'WAB' && (
                  <span className="text-slate-400 flex items-center gap-0.5" title="Wheelchair Accessible Bus">
                    <Accessibility className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px]">WAB</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Next 3 Arrivals */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {renderArrivalPill(arrival.nextBus, 'Next', true)}
          <div className="hidden xs:flex items-center gap-1.5">
            {renderArrivalPill(arrival.nextBus2, '2nd')}
            {renderArrivalPill(arrival.nextBus3, '3rd')}
          </div>
        </div>
      </div>

      {/* Mobile secondary row for 2nd and 3rd bus if screen is tiny */}
      <div className="flex xs:hidden items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] text-slate-400 mr-auto">Subsequent buses:</span>
        {renderArrivalPill(arrival.nextBus2, '2nd')}
        {renderArrivalPill(arrival.nextBus3, '3rd')}
      </div>

      {/* Alarm status banner if active */}
      {alarmActive && (
        <div className="mt-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-1.5">
            <BellRing className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            <span>
              {alarmNotified 
                ? `Bus ${arrival.serviceNo} is arriving at stop now!`
                : `Alarm set: alert when Bus ${arrival.serviceNo} is 2 mins away.`}
            </span>
          </div>
          <button 
            onClick={handleToggleAlarm}
            className="text-[10px] font-semibold underline text-amber-900 dark:text-amber-100 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Accordion Toggle Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Details' : 'Live Bus & Route'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onSelectServiceRoute && (
            <button
              onClick={() => onSelectServiceRoute(arrival.serviceNo)}
              className="text-[11px] text-red-600 dark:text-red-400 hover:underline font-medium ml-1 cursor-pointer"
            >
              Full Route
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onFocusBusOnMap && (
            <button
              onClick={() => onFocusBusOnMap(arrival.serviceNo)}
              className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Track live vehicle on map"
            >
              <Navigation className="w-3 h-3 text-red-500" />
              <span>Track on Map</span>
            </button>
          )}

          <button
            onClick={handleToggleAlarm}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors cursor-pointer ${
              alarmActive 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Set arrival alarm"
          >
            <Bell className="w-3 h-3" />
            <span className="hidden sm:inline">{alarmActive ? 'Alarm On' : '2-Min Alarm'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Live Telemetry & Stop Sequence Accordion */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">VEHICLE PLATE</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                {arrival.nextBus?.vehiclePlate || 'SG5821P'}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">CURRENT SPEED</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                {arrival.nextBus?.speedKmH ? `${arrival.nextBus.speedKmH} km/h` : '32 km/h'}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">BUS CAPACITY</div>
              <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                {arrival.nextBus ? getLoadConfig(arrival.nextBus.load).label : 'Available'}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">FIRST / LAST BUS</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">
                {catalog ? `${catalog.firstBusTime} - ${catalog.lastBusTime}` : '05:30 - 23:45'}
              </div>
            </div>
          </div>

          {/* Mini Route Timeline */}
          {catalog?.stopsDirection1 && catalog.stopsDirection1.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Approach Route towards {catalog.destination}
              </div>
              <div className="space-y-2 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {catalog.stopsDirection1.map((st, idx) => {
                  const isCurrent = st.busStopCode === busStopCode;
                  return (
                    <div key={st.busStopCode} className="relative flex items-center justify-between text-xs">
                      <span className={`absolute -left-4 w-3.5 h-3.5 rounded-full border-2 ${
                        isCurrent 
                          ? 'bg-red-600 border-white dark:border-slate-900 ring-2 ring-red-500' 
                          : 'bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-600'
                      }`} />
                      <div className="flex items-center gap-2 pl-2">
                        <span className="font-mono text-[10px] text-slate-400">{st.busStopCode}</span>
                        <span className={`truncate max-w-[200px] ${isCurrent ? 'font-bold text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {st.description}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {st.distanceKm} km
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
