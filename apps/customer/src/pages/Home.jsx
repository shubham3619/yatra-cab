import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth, Badge, toast } from '@yatracab/ui';
import {
  MapPin, Navigation, ArrowRight, Repeat, Users2, Gavel, Gift, Sparkles, ChevronRight, Car, Route as RouteIcon,
} from 'lucide-react';
import { api } from '../api.js';
import { LiveMap } from '../components/LiveMap.jsx';
import { PHOTOS } from '../lib/photos.js';

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
            photo={PHOTOS.oneWay}
            alt="Smiling man in a car"
          />
          <ServiceTile
            to="/book?trip=round_trip"
            icon={Repeat}
            title="Round Trip"
            text="Outstation & return"
            photo={PHOTOS.roundTrip}
            alt="Family taking a selfie by their car"
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
          photo={PHOTOS.seatShare}
          alt="Group of friends enjoying a drive together"
        />

        {/* Ride alert — wide */}
        <WideTile
          to="/book?mode=bidding"
          icon={Gavel}
          title="Name Your Price"
          text="Post a Ride Alert and let verified drivers bid — you pick the best quote."
          cta="Post alert"
          tone="dark"
          photo={PHOTOS.bidding}
          alt="Happy man giving a thumbs up"
        />

        {/* Refer & earn banner — chain referral mechanic */}
        <Link
          to="/rewards"
          className="relative block overflow-hidden rounded-2xl bg-brand-gradient p-5 text-accent-fg shadow-glow transition-transform hover:-translate-y-0.5"
        >
          <ChainIllustration className="pointer-events-none absolute -right-1 top-1/2 h-[92%] w-2/5 -translate-y-1/2 opacity-95" />
          <div className="relative flex items-center gap-4 pr-28 sm:pr-36">
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold">Refer &amp; Kamao — chain rewards</p>
              <p className="mt-0.5 text-sm text-white/85">
                You refer a friend, they refer their friend — <span className="font-semibold text-white">their rides earn you a % too.</span> Lifetime, auto-credited.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-accent">
                {user?.points ? `${user.points} pts` : 'Start your chain'} <ChevronRight size={13} />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// Chain-referral illustration: You → Friend → Friend's friend, with the
// reward % flowing back down the chain to your wallet.
function ChainIllustration({ className }) {
  return (
    <svg viewBox="0 0 150 120" fill="none" className={className} aria-label="Referral chain: friends of friends also earn you rewards">
      {/* chain links connecting the three people */}
      <path d="M34 34 L64 58 M78 62 L106 40" stroke="white" strokeOpacity="0.85" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
      {/* person 1 — you */}
      <g>
        <circle cx="24" cy="26" r="13" fill="white" fillOpacity="0.95" />
        <circle cx="24" cy="22" r="4.5" fill="rgb(124 58 237)" />
        <path d="M16 32c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="rgb(124 58 237)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      </g>
      {/* person 2 — your friend */}
      <g>
        <circle cx="71" cy="62" r="11" fill="white" fillOpacity="0.85" />
        <circle cx="71" cy="58.5" r="3.8" fill="rgb(124 58 237)" />
        <path d="M64.5 67c1.3-3.4 3.8-5 6.5-5s5.2 1.6 6.5 5" stroke="rgb(124 58 237)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </g>
      {/* person 3 — friend's friend */}
      <g>
        <circle cx="116" cy="34" r="9.5" fill="white" fillOpacity="0.75" />
        <circle cx="116" cy="31" r="3.2" fill="rgb(124 58 237)" />
        <path d="M110.5 38.5c1.1-2.9 3.2-4.3 5.5-4.3s4.4 1.4 5.5 4.3" stroke="rgb(124 58 237)" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
      {/* % coins flowing back along the chain */}
      <g fontFamily="system-ui" fontWeight="700" textAnchor="middle">
        <circle cx="95" cy="55" r="8" fill="#fbbf24" />
        <text x="95" y="58.5" fontSize="9" fill="#78350f">%</text>
        <circle cx="49" cy="42" r="8" fill="#fbbf24" />
        <text x="49" y="45.5" fontSize="9" fill="#78350f">%</text>
      </g>
      {/* wallet receiving the rewards, under "you" */}
      <g>
        <rect x="10" y="78" width="42" height="28" rx="6" fill="white" fillOpacity="0.95" />
        <rect x="10" y="86" width="42" height="4" fill="rgb(124 58 237)" fillOpacity="0.25" />
        <circle cx="44" cy="92" r="5" fill="rgb(124 58 237)" />
        <text x="44" y="95" fontSize="7" fill="white" fontWeight="700" textAnchor="middle" fontFamily="system-ui">₹</text>
      </g>
      {/* arrow: rewards drop into the wallet */}
      <path d="M31 56 L31 70 M27 66 L31 71 L35 66" stroke="#fbbf24" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Photo-backed square tile (RodBez style): image fills the card, dark
// gradient keeps the text readable.
function ServiceTile({ to, icon: Icon, title, text, photo, alt, sub }) {
  return (
    <Link
      to={to}
      className="group relative block h-48 overflow-hidden rounded-2xl bg-ink-900 text-white shadow-soft transition-transform hover:-translate-y-0.5"
    >
      <img src={photo} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
          <Icon size={16} />
        </span>
        <p className="font-display text-lg font-bold leading-tight">{title}</p>
        <p className="mt-0.5 text-xs text-white/80">{text}</p>
        {sub && <p className="mt-0.5 text-[11px] font-medium text-white/90">{sub}</p>}
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold">
          Book now <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

// Wide tile with the photo filling the right edge.
function WideTile({ to, icon: Icon, title, text, badge, cta, tone, photo, alt }) {
  const dark = tone === 'dark';
  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft ${
        dark ? 'bg-ink-900 text-white' : 'border border-ink-200/70 bg-white'
      }`}
    >
      {photo && (
        <img
          src={photo}
          alt={alt}
          loading="lazy"
          className="absolute inset-y-0 right-0 h-full w-1/3 object-cover [mask-image:linear-gradient(to_left,black_60%,transparent)] transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${dark ? 'bg-white/10 text-white' : 'bg-accent-soft text-accent'}`}>
        <Icon size={23} />
      </span>
      <div className="relative min-w-0 flex-1 pr-16 sm:pr-24">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`font-display text-base font-bold ${dark ? 'text-white' : 'text-ink-900'}`}>{title}</p>
          {badge && <Badge tone={dark ? 'warning' : 'accent'}>{badge}</Badge>}
        </div>
        <p className={`mt-0.5 text-xs ${dark ? 'text-white/75' : 'text-ink-500'}`}>{text}</p>
        <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold ${dark ? 'bg-white text-ink-900' : 'bg-brand-gradient text-accent-fg shadow-glow'}`}>
          {cta} <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
