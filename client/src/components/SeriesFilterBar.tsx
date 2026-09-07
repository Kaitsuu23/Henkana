"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Filters {
  genres:   Option[];
  seasons:  Option[];
  studios:  Option[];
  statuses: Option[];
  types:    Option[];
  subs:     Option[];
  orders:   Option[];
}

interface SeriesFilterBarProps {
  filters: Filters;
}

// ─────────────────────────────────────────────────────────────
// Reusable Dropdown
// ─────────────────────────────────────────────────────────────
function Dropdown({
  label,
  options,
  selected,
  multi = false,
  onChange,
}: {
  label: string;
  options: Option[];
  selected: string | string[];
  multi?: boolean;
  onChange: (val: string | string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayLabel = (() => {
    if (multi) {
      const arr = selected as string[];
      if (arr.length === 0) return `${label} Semua`;
      if (arr.length === 1) return options.find(o => o.value === arr[0])?.label ?? label;
      return `${label} (${arr.length})`;
    }
    const s = selected as string;
    if (!s) return `${label} Semua`;
    const selectedLabel = options.find(o => o.value === s)?.label ?? s;
    return `${label} ${selectedLabel}`;
  })();

  const isActive = multi ? (selected as string[]).length > 0 : !!(selected as string);

  function handleSingle(val: string) {
    onChange(val);
    setOpen(false);
  }

  function handleMulti(val: string) {
    const arr = selected as string[];
    onChange(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors border ${
          isActive
            ? "bg-primary/20 border-primary text-primary"
            : "bg-muted/50 border-border/50 text-foreground/80 hover:bg-muted"
        }`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 ml-2 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[180px] max-h-64 overflow-y-auto bg-background border border-border shadow-xl">
          {options.map(o => {
            const active = multi
              ? (selected as string[]).includes(o.value)
              : selected === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => multi ? handleMulti(o.value) : handleSingle(o.value)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-muted transition-colors ${
                  active ? "text-primary font-semibold bg-primary/10" : "text-foreground/80"
                }`}
              >
                <span>{o.label}</span>
                {multi && active && <span className="text-primary text-xs ml-2">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main filter bar
// ─────────────────────────────────────────────────────────────
export function SeriesFilterBar({ filters }: SeriesFilterBarProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [genre,  setGenre]  = useState<string[]>(searchParams.getAll("genre[]"));
  const [season, setSeason] = useState<string[]>(searchParams.getAll("season[]"));
  const [studio, setStudio] = useState<string[]>(searchParams.getAll("studio[]"));
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [type,   setType]   = useState(searchParams.get("type")   || "");
  const [sub,    setSub]    = useState(searchParams.get("sub")    || "");
  const [order,  setOrder]  = useState(searchParams.get("order")  || "");

  useEffect(() => {
    setGenre(searchParams.getAll("genre[]"));
    setSeason(searchParams.getAll("season[]"));
    setStudio(searchParams.getAll("studio[]"));
    setStatus(searchParams.get("status") || "");
    setType(searchParams.get("type")     || "");
    setSub(searchParams.get("sub")       || "");
    setOrder(searchParams.get("order")   || "");
  }, [searchParams]);

  const handleSearch = useCallback(() => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (type)   p.set("type",   type);
    if (sub)    p.set("sub",    sub);
    if (order)  p.set("order",  order);
    genre.forEach(v  => p.append("genre[]",  v));
    season.forEach(v => p.append("season[]", v));
    studio.forEach(v => p.append("studio[]", v));
    router.push(`/daftar-series${p.toString() ? "?" + p.toString() : ""}`);
  }, [status, type, sub, order, genre, season, studio, router]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Enter") handleSearch();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSearch]);

  return (
    <div className="bg-muted/20 border border-border/40 p-4 space-y-2">
      {/* Row 1: Genre, Season, Studio, Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Dropdown
          label="Genre"
          options={filters.genres}
          selected={genre}
          multi
          onChange={v => setGenre(v as string[])}
        />
        <Dropdown
          label="Season"
          options={filters.seasons}
          selected={season}
          multi
          onChange={v => setSeason(v as string[])}
        />
        <Dropdown
          label="Studio"
          options={filters.studios}
          selected={studio}
          multi
          onChange={v => setStudio(v as string[])}
        />
        <Dropdown
          label="Status"
          options={filters.statuses ?? []}
          selected={status}
          onChange={v => setStatus(v as string)}
        />
      </div>

      {/* Row 2: Tipe, Sub, Order, Cari */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Dropdown
          label="Tipe"
          options={filters.types ?? []}
          selected={type}
          onChange={v => setType(v as string)}
        />
        <Dropdown
          label="Sub"
          options={filters.subs ?? []}
          selected={sub}
          onChange={v => setSub(v as string)}
        />
        <Dropdown
          label="Order by"
          options={filters.orders ?? []}
          selected={order}
          onChange={v => setOrder(v as string)}
        />
        <button
          type="button"
          onClick={handleSearch}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <Search className="h-4 w-4" />
          Mencari
        </button>
      </div>
    </div>
  );
}
