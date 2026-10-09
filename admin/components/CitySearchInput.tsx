'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { suggestCities, type CitySuggestion } from '@/lib/api';

export interface CitySearchInputProps {
  value: string;
  onChange: (cityName: string) => void;
  onSelect?: (suggestion: CitySuggestion) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
  autoFocus?: boolean;
}

export function CitySearchInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Ex: Tóquio, São Paulo, Fortaleza...',
  required = false,
  className = '',
  id,
  autoFocus = false,
}: CitySearchInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CitySuggestion | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(text: string) {
    setQuery(text);
    onChange(text);
    setSelectedSuggestion(null);
    setHighlightedIndex(-1);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    debounceRef.current = window.setTimeout(async () => {
      try {
        const results = await suggestCities(trimmed);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  function handleSelect(item: CitySuggestion) {
    setQuery(item.city);
    onChange(item.city);
    setSelectedSuggestion(item);
    if (onSelect) {
      onSelect(item);
    }
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          id={id}
          type="text"
          required={required}
          value={query}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 && query.trim().length >= 2) {
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-none border border-[#e8e0d7] bg-white px-3.5 py-2.5 text-xs text-[#1c1917] placeholder:text-[#a89f91] outline-none transition-all focus:border-[#9a4632] focus:ring-1 focus:ring-[#9a4632] pr-9 ${className}`}
        />

        {/* Loading / Map Pin icon indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a8178]">
          {loading ? (
            <svg className="size-4 animate-spin text-[#9a4632]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg className="size-4 text-[#a89f91]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )}
        </div>
      </div>

      {/* Verified Google Maps Match Pill */}
      {selectedSuggestion ? (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#7c2f1d]">
          <svg className="size-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
          </svg>
          <span className="font-medium truncate">
            Maps: {selectedSuggestion.label || `${selectedSuggestion.city}, ${selectedSuggestion.country}`}
          </span>
        </div>
      ) : null}

      {/* Floating Suggestions Dropdown */}
      {open && suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-none border border-[#e8e0d7] bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8a8178] border-b border-[#f0eae1] mb-1">
            Sugestões do Google Maps
          </div>
          <ul className="space-y-0.5">
            {suggestions.map((item, index) => {
              const isHighlighted = index === highlightedIndex;
              return (
                <li key={`${item.city}-${item.region}-${item.country}-${index}`}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2.5 rounded-none px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                      isHighlighted
                        ? 'bg-[#faf2ee] text-[#7c2f1d]'
                        : 'text-[#1c1917] hover:bg-[#faf8f5] hover:text-[#9a4632]'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="grid size-6 shrink-0 place-items-center rounded-none bg-[#faf2ee] text-[#9a4632]">
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{item.city}</p>
                      <p className="text-[11px] text-[#8a8178] truncate">
                        {item.region ? `${item.region}, ${item.country}` : item.country}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
