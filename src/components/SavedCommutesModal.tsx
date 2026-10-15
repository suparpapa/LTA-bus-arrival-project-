import React, { useState } from 'react';
import { SavedBookmark, BusStop } from '../types/bus';
import { X, Bookmark, Trash2, ArrowRight, Sun, Moon, MapPin, Plus } from 'lucide-react';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeBuses';

interface SavedCommutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: SavedBookmark[];
  onRemoveBookmark: (id: string) => void;
  onSelectStopCode: (code: string) => void;
  onAddBookmark: (code: string, tag: 'Morning' | 'Evening' | 'General', label?: string) => void;
}

export const SavedCommutesModal: React.FC<SavedCommutesModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
  onSelectStopCode,
  onAddBookmark,
}) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Morning' | 'Evening'>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStopCode, setNewStopCode] = useState(SINGAPORE_BUS_STOPS[0].busStopCode);
  const [newTag, setNewTag] = useState<'Morning' | 'Evening' | 'General'>('Morning');
  const [newLabel, setNewLabel] = useState('');

  if (!isOpen) return null;

  const filteredBookmarks = bookmarks.filter((bm) => {
    if (activeTab === 'All') return true;
    return bm.tag === activeTab;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBookmark(newStopCode, newTag, newLabel || undefined);
    setShowAddForm(false);
    setNewLabel('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-red-600 fill-current" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Saved Commute Stops
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Add Action */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('All')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'All'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({bookmarks.length})
            </button>
            <button
              onClick={() => setActiveTab('Morning')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'Morning'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Morning</span>
            </button>
            <button
              onClick={() => setActiveTab('Evening')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'Evening'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3 h-3 text-indigo-500" />
              <span>Evening</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bookmark</span>
          </button>
        </div>

        {/* Add Form Drawer */}
        {showAddForm && (
          <form onSubmit={handleCreate} className="p-4 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Save a Singapore Bus Stop for Quick Access
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Select Bus Stop</label>
                <select
                  value={newStopCode}
                  onChange={(e) => setNewStopCode(e.target.value)}
                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                >
                  {SINGAPORE_BUS_STOPS.map((st) => (
                    <option key={st.busStopCode} value={st.busStopCode}>
                      {st.busStopCode} - {st.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-medium">Commute Tag</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value as any)}
                  className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                >
                  <option value="Morning">Morning Commute</option>
                  <option value="Evening">Evening Commute</option>
                  <option value="General">General Transit</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-medium">Custom Label (Optional)</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Near Office, Gym, Home"
                className="w-full mt-1 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredBookmarks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Bookmark className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p>No saved stops found in this category.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-red-600 font-medium underline"
              >
                Bookmark your favorite commute stops
              </button>
            </div>
          ) : (
            filteredBookmarks.map((bm) => {
              const stop = SINGAPORE_BUS_STOPS.find((s) => s.busStopCode === bm.busStopCode);
              return (
                <div
                  key={bm.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div 
                    onClick={() => {
                      onSelectStopCode(bm.busStopCode);
                      onClose();
                    }}
                    className="flex-1 cursor-pointer min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 rounded">
                        {bm.busStopCode}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {bm.tag}
                      </span>
                      {bm.customLabel && (
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 truncate">
                          · {bm.customLabel}
                        </span>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                      {stop?.description || 'Bus Stop'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {stop?.roadName} · {stop?.services.join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onSelectStopCode(bm.busStopCode);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onRemoveBookmark(bm.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
