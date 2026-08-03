import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth, Badge, toast } from '@yatracab/ui';
import {
  MapPin, Navigation, ArrowRight, Repeat, Users2, Gavel, Gift, Sparkles, ChevronRight, Car, Route as RouteIcon,
} from 'lucide-react';
import { api } from '../api.js';
import { LiveMap } from '../components/LiveMap.jsx';

// Reverse-geocode via OpenStreetMap (same provider as LocationInput).
async function reverseGeocode(lat, lng) {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('lookup failed');
  const data = await res.json();
  return data.display_name?.split(',').slice(0, 3).map((s) => s.trim()).join(', ');
}

export default function Home() {
  const { user } = useAuth();
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState('');

  // Live data for the tiles.
  const routesQ = useQuery({ queryKey: ['routes'], queryFn: () => api.get('/shared/routes').then((r) => r.routes) });
  const sharesQ = useQuery({ queryKey: ['daily-routes-home'], queryFn: () => api.get('/customer/daily-routes').then((r) => r.routes) });

  const onLocate = async (pos) => {
    setPosition(pos);
    try {
      setAddress(await reverseGeocode(pos.lat, pos.lng));
    } catch {
      setAddress('My current location');
    }
  };

  // Try GPS once on load (silently — the map button retries on demand).
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => onLocate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seatRides = sharesQ.data?.filter((r) => r.bookingType === 'seat_share').length ?? null;

  return (
    <div className="-mx-4 -mt-5 animate-fade-in sm:mx-0 sm:mt-0">
      {/* Address bar */}
      <div className="flex items-center gap-2.5 bg-white px-4 py-3 sm:rounded-2xl sm:border sm:border-ink-200/70 sm:shadow-card">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <MapPin size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Your location</p>
          <p className="truncate text-sm font-semibold text-ink-900">
            {address || (position ? 'Locating…' : 'Enable location to auto-detect')}
          </p>
        </div>
        <Link to="/book" className="flex items-center gap-1 rounded-full bg-brand-gradient px-3.5 py-2 text-xs font-semibold text-accent-fg shadow-glow transition-transform hover:scale-105">
          Book <ArrowRight size={13} />
        </Link>
      </div>

      {/* Live map */}
      <LiveMap position={position} onLocate={onLocate} className="h-[38vh] min-h-[240px] w-full sm:mt-4 sm:h-[300px] sm:rounded-2xl sm:border sm:border-ink-200/70" />

      {/* Welcome ribbon */}
      <div className="mx-4 -mt-3 relative z-[600] flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm text-white shadow-pop sm:mx-0 sm:mt-4">
        <Sparkles size={15} className="shrink-0 text-amber-300" />
        <span className="truncate">Namaste{user?.name ? `, ${user.name.split(' ')[0]}` : ''} — where to today?</span>
      </div>

      {/* Service tiles */}
      <div className="space-y-3 px-4 pt-4 sm:px-0">
        <div className="grid grid-cols-2 gap-3">
          <ServiceTile
            to="/book?trip=one_way"
            icon={Navigation}
            title="One-Way"
            text="One side journey (drop-off)"
            gradient="from-violet-600 to-fuchsia-500"
          />
          <ServiceTile
            to="/book?trip=round_trip"
            icon={Repeat}
            title="Round Trip"
            text="Outstation & return"
            gradient="from-indigo-600 to-violet-500"
            sub={routesQ.data ? `${routesQ.data.length} popular routes` : null}
          />
        </div>

        {/* Share a seat — wide */}
        <WideTile
          to="/discover"
          icon={Users2}
          title="Share a Seat"
          text="Per-seat carpooling on daily routes — pay only for your seat."
          badge={seatRides != null ? `${seatRides} rides running` : null}
          cta="Find a seat"
        />

        {/* Ride alert — wide */}
        <WideTile
          to="/book?mode=bidding"
          icon={Gavel}
          title="Name Your Price"
          text="Post a Ride Alert and let verified drivers bid — you pick the best quote."
          cta="Post alert"
          tone="dark"
        />

        {/* Refer & earn banner */}
        <Link
          to="/rewards"
          className="block overflow-hidden rounded-2xl bg-brand-gradient p-5 text-accent-fg shadow-glow transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Gift size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold">Refer &amp; Kamao</p>
              <p className="text-sm text-white/80">Earn points on every friend's ride — auto-discount on your next trip.</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-accent">
              {user?.points ? `${user.points} pts` : 'Refer now'} <ChevronRight size={13} />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

function ServiceTile({ to, icon: Icon, title, text, gradient, sub }) {
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-soft transition-transform hover:-translate-y-0.5`}
    >
      <span className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 transition-transform group-hover:scale-125" />
      <Icon size={22} className="mb-6" />
      <p className="font-display text-lg font-bold leading-tight">{title}</p>
      <p className="mt-0.5 text-xs text-white/75">{text}</p>
      {sub && <p className="mt-1 text-[11px] font-medium text-white/90">{sub}</p>}
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
        Book now <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function WideTile({ to, icon: Icon, title, text, badge, cta, tone }) {
  const dark = tone === 'dark';
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 rounded-2xl p-4.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft ${
        dark ? 'bg-ink-900 text-white' : 'border border-ink-200/70 bg-white'
      } p-5`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${dark ? 'bg-white/10 text-white' : 'bg-accent-soft text-accent'}`}>
        <Icon size={23} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`font-display text-base font-bold ${dark ? 'text-white' : 'text-ink-900'}`}>{title}</p>
          {badge && <Badge tone={dark ? 'warning' : 'accent'}>{badge}</Badge>}
        </div>
        <p className={`mt-0.5 text-xs ${dark ? 'text-white/70' : 'text-ink-500'}`}>{text}</p>
      </div>
      <span className={`flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-xs font-bold ${dark ? 'bg-white text-ink-900' : 'bg-brand-gradient text-accent-fg shadow-glow'}`}>
        {cta} <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
