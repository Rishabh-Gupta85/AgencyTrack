import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, X } from 'lucide-react';
import { DateRangePreset, DATE_PRESET_LABELS, DatePreset } from '../utils/dateFilter';

export type { DateRangePreset, DatePreset };

interface DateFilterDropdownProps {
  selectedPreset: DateRangePreset;
  onSelectPreset: (preset: DateRangePreset) => void;
  customStart?: string;
  customEnd?: string;
  onCustomDatesChange?: (start: string, end: string) => void;
  className?: string;
}

export const DateFilterDropdown: React.FC<DateFilterDropdownProps> = ({
  selectedPreset,
  onSelectPreset,
  customStart = '',
  customEnd = '',
  onCustomDatesChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(customStart);
  const [tempEnd, setTempEnd] = useState(customEnd);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presets: DateRangePreset[] = ['all', 'today', '7d', '30d', 'this_month', 'last_month', 'custom'];

  const handleApplyCustom = () => {
    if (onCustomDatesChange) {
      onCustomDatesChange(tempStart, tempEnd);
    }
    onSelectPreset('custom');
    setIsOpen(false);
  };

  const getButtonLabel = () => {
    if (selectedPreset === 'custom') {
      if (customStart && customEnd) {
        return `${customStart} to ${customEnd}`;
      }
      return 'Custom Range';
    }
    return DATE_PRESET_LABELS[selectedPreset] || 'Filter by Date';
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
          selectedPreset !== 'all'
            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
            : 'bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>{getButtonLabel()}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-2 space-y-1 text-xs">
          <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Filter by Order Date
          </div>

          <div className="space-y-0.5">
            {presets.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  if (preset !== 'custom') {
                    onSelectPreset(preset);
                    setIsOpen(false);
                  } else {
                    onSelectPreset('custom');
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  selectedPreset === preset
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{DATE_PRESET_LABELS[preset]}</span>
                {selectedPreset === preset && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          {selectedPreset === 'custom' && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">From:</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={e => setTempStart(e.target.value)}
                  className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">To:</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={e => setTempEnd(e.target.value)}
                  className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Apply Custom Range
              </button>
            </div>
          )}

          {selectedPreset !== 'all' && (
            <button
              type="button"
              onClick={() => {
                onSelectPreset('all');
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-medium transition-colors cursor-pointer pt-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Date Filter</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
