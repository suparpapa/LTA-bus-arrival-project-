import React, { useState } from 'react';
import { BUS_SERVICES_CATALOG } from '../data/singaporeBuses';
import { BusServiceDetails, BusStop } from '../types/bus';
import { X, Search, Clock, ArrowRight, Train, MapPin, Bus } from 'lucide-react';

interface RouteDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStopCode: (code: string) => void;
  initialServiceNo?: string | null;
}

export const RouteDirectoryModal: React.FC<RouteDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectStopCode,
  initialServiceNo,
}) => {
  const [search, setSearch] = useState(initialServiceNo || '');
  const [selectedService, setSelectedService] = useState<string>(
    initialServiceNo || Object.keys(BUS_SERVICES_CATALOG)[0]
  );

  if (!isOpen) return null;

  const services = Object.values(BUS_SERVICES_CATALOG);
  const filteredServices = services.filter((svc) =>
    svc.serviceNo.toLowerCase().includes(search.toLowerCase()) ||
    svc.origin.toLowerCase().includes(search.toLowerCase()) ||
    svc.destination.toLowerCase().includes(search.toLowerCase())
  );

  const activeService = BUS_SERVICES_CATALOG[selectedService] || filteredServices[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-red-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Singapore Bus Route Directory
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: 2 Columns */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Column: Route Selector & Search */}
          <div className="w-full md:w-80 flex flex-col p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bus number or terminal..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-red-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-48 md:max-h-full">
              {filteredServices.map((svc) => {
                const isSelected = svc.serviceNo === activeService?.serviceNo;
                return (
                  <button
                    key={svc.serviceNo}
                    onClick={() => setSelectedService(svc.serviceNo)}
                    className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                        isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                      }`}>
                        {svc.serviceNo}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate max-w-[140px]">
                          {svc.origin} → {svc.destination}
                        </div>
                        <div className={`text-[10px] ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                          {svc.category} · {svc.operator}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Route Details & Stops Sequence */}
          {activeService ? (
            <div className="flex-1 flex flex-col p-5 overflow-y-auto space-y-4">
              {/* Route Summary Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-3.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      {activeService.serviceNo}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <span>{activeService.origin}</span>
                        <ArrowRight className="w-4 h-4 text-red-600" />
                        <span>{activeService.destination}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Operator: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeService.operator}</span> · Type: {activeService.category}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono">Operating Hours</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {activeService.firstBusTime} - {activeService.lastBusTime}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono">Peak Headway</span>
                    <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                      {activeService.frequencyPeak}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono">Off-Peak Headway</span>
                    <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                      {activeService.frequencyOffPeak}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stop by Stop Sequence */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Route Stops Progression (Click any stop to view live arrivals)
                </h4>

                <div className="space-y-2 relative pl-5 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  {activeService.stopsDirection1.map((st, i) => (
                    <div
                      key={st.busStopCode}
                      onClick={() => {
                        onSelectStopCode(st.busStopCode);
                        onClose();
                      }}
                      className="group relative flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      <span className="absolute -left-5 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-red-600 group-hover:scale-125 transition-transform" />
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded">
                          {st.busStopCode}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                            {st.description}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {st.roadName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-right shrink-0">
                        <span className="font-mono text-xs text-slate-400">
                          {st.distanceKm} km
                        </span>
                        <span className="text-[11px] text-red-600 font-semibold group-hover:underline">
                          View Live →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
