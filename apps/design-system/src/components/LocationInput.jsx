import { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed, Loader2, X, Search } from 'lucide-react';
import { cn } from '../lib/cn.js';

// Free geocoding via OpenStreetMap Nominatim (no API key). Respect its usage
// policy: debounce requests and keep volume low. Swap for Google Places /
// Mapbox by changing only these two helpers.
const NOMINATIM = 'https://nominatim.openstreetmap.org';

const shortLabel = (displayName = '') => displayName.split(',').slice(0, 3).map((s) => s.trim()).join(', ');

async function searchPlaces(q, signal) {
  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  return data.map((p) => ({ address: shortLabel(p.display_name), full: p.display_name, lat: Number(p.lat), lng: Number(p.lon) }));
}

async function reverseGeocode(lat, lng) {
  const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Lookup failed');
  const data = await res.json();
  return { address: shortLabel(data.display_name) || 'My location', lat, lng };
}

/**
 * Dynamic location picker: type-to-search autocomplete + "use my current
 * location". Emits { address, lat, lng } via onChange.
 */
export function LocationInput({
  value,
  onChange,
  placeholder = 'Search a place…',
  allowCurrentLocation = false,
  icon: Icon = MapPin,
  onError,
}) {
  const [query, setQuery] = useState(value?.address || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const timer = useRef(null);
  const abort = useRef(null);
  const boxRef = useRef(null);

  // Keep the text in sync when the value is set externally (e.g. popular route).
  useEffect(() => {
    setQuery(value?.address || '');
  }, [value?.address]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDoc = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const onType = (text) => {
    setQuery(text);
    onChange?.(null); // invalidate previous selection until a new pick
    clearTimeout(timer.current);
    if (text.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      abort.current?.abort();
      abort.current = new AbortController();
      setLoading(true);
      setOpen(true);
      try {
        setResults(await searchPlaces(text, abort.current.signal));
      } catch (err) {
        if (err.name !== 'AbortError') setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const pick = (place) => {
    onChange?.({ address: place.address, lat: place.lat, lng: place.lng });
    setQuery(place.address);
    setOpen(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return onError?.('Geolocation is not supported on this device');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const place = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          pick(place);
        } catch {
          const p = { address: 'My current location', lat: pos.coords.latitude, lng: pos.coords.longitude };
          pick(p);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        onError?.(err.code === 1 ? 'Location permission denied' : "Couldn't get your location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selected = value?.lat != null;

  return (
    <div className="relative" ref={boxRef}>
      <div className={cn('flex items-center gap-2 rounded-xl border bg-white px-3 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25', selected ? 'border-accent/50' : 'border-ink-200')}>
        <Icon size={17} className={cn('shrink-0', selected ? 'text-accent' : 'text-ink-400')} />
        <input
          value={query}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          className="h-11 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
        {loading && <Loader2 size={15} className="animate-spin text-ink-400" />}
        {query && !loading && (
          <button type="button" onClick={() => { setQuery(''); onChange?.(null); setResults([]); }} className="text-ink-300 hover:text-ink-500">
            <X size={15} />
          </button>
        )}
        {allowCurrentLocation && (
          <button
            type="button"
            onClick={useMyLocation}
            title="Use my current location"
            className="flex shrink-0 items-center gap-1 rounded-lg bg-accent-soft px-2 py-1 text-xs font-medium text-accent transition-colors hover:brightness-95"
          >
            {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
            <span className="hidden sm:inline">{locating ? 'Locating…' : 'Locate'}</span>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop animate-fade-in">
          {loading && results.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-ink-400"><Loader2 size={15} className="animate-spin" /> Searching…</div>
          ) : results.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-ink-400"><Search size={15} /> No matches — try a different search</div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.lat}-${r.lng}-${i}`}
                type="button"
                onClick={() => pick(r)}
                className="flex w-full items-start gap-2.5 border-b border-ink-50 px-4 py-2.5 text-left last:border-0 hover:bg-ink-50"
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-accent" />
                <span className="text-sm text-ink-700">{r.address}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
