import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  horizonBadge?: string;
  depth?: number;
  color?: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Seçiniz...',
  searchable = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.horizonBadge && o.horizonBadge.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (isOpen) {
      const idx = filteredOptions.findIndex((o) => o.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, searchable, value]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        onChange(filteredOptions[highlightedIndex].value);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="text-xs uppercase font-extrabold tracking-wider text-text-muted block mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button (Min 48px Touch Target) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[48px] px-4 py-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
          disabled
            ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/5'
            : isOpen
            ? 'bg-[#182052] border-accent-pink shadow-[0_0_16px_rgba(255,61,127,0.25)]'
            : 'bg-white/5 hover:bg-white/[0.08] border-white/10 hover:border-white/20'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedOption?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}

          {selectedOption?.horizonBadge && (
            <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md bg-white/10 text-white shrink-0">
              {selectedOption.horizonBadge}
            </span>
          )}

          <span
            className={`text-sm font-semibold truncate ${
              selectedOption ? 'text-white' : 'text-text-muted'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-accent-pink' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#141B4E] border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box if Searchable */}
          {searchable && (
            <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-white/[0.02]">
              <Search className="w-4 h-4 text-text-muted shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-text-muted focus:outline-none"
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted">Sonuç bulunamadı</div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;
                const depthIndent = opt.depth ? opt.depth * 14 : 0;

                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{ paddingLeft: `${16 + depthIndent}px` }}
                    className={`min-h-[48px] pr-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-accent-pink/15 text-white font-bold'
                        : isHighlighted
                        ? 'bg-white/10 text-white'
                        : 'text-text-secondary hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {opt.depth ? (
                        <span className="text-text-muted text-xs select-none">↳</span>
                      ) : null}

                      {opt.color && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}

                      {opt.horizonBadge && (
                        <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md bg-white/10 text-white shrink-0">
                          {opt.horizonBadge}
                        </span>
                      )}

                      <span className="text-sm truncate">{opt.label}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-accent-pink stroke-[3] shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

