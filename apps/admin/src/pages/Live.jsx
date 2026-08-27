import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardBody, Badge, PageHeader, QueryBoundary, LoadingScreen, EmptyState } from '@yatracab/ui';
import { Radio, Car, Wifi, WifiOff } from 'lucide-react';
import { api } from '../api.js';
import { getSocket } from '../socket.js';

const JAIPUR = [26.9124, 75.7873];

// Busy cars are accented, idle ones dark, so a glance shows utilisation.
const carIcon = (heading = 0, busy = false) =>
  L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;transform:rotate(${heading}deg);transition:transform .4s ease">
      <div style="width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;
        background:${busy ? 'rgb(var(--yc-accent))' : '#1c1917'};border:2px solid #fff;
        box-shadow:0 3px 10px -2px rgba(0,0,0,.45)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(-90deg)">
          <path d="M5 17h14M6.5 17V9.5L9 6h6l2.5 3.5V17"/><circle cx="8" cy="17" r="1.6"/><circle cx="16" cy="17" r="1.6"/>
        </svg>
      </div></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

export default function Live() {
  const holderRef = useRef(null);
  const mapRef = useRef(null);
  const markers = useRef(new Map());
  const [connected, setConnected] = useState(false);
  // Socket updates are merged over the polled snapshot, keyed by driver id.
  const [moved, setMoved] = useState({});

  // The snapshot is the source of truth on load and the fallback if the socket
  // drops; the stream keeps it moving in between.
  const query = useQuery({
    queryKey: ['admin-live-drivers'],
    queryFn: () => api.get('/admin/drivers/live').then((r) => r.drivers),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!holderRef.current || mapRef.current) return undefined;
    const map = L.map(holderRef.current, { zoomControl: true }).setView(JAIPUR, 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onMoved = (p) =>
      p?.driverId && setMoved((m) => ({ ...m, [p.driverId]: { lat: p.lat, lng: p.lng, heading: p.heading, at: p.at } }));
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('driver:moved', onMoved);
    setConnected(socket.connected);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('driver:moved', onMoved);
    };
  }, []);

  // Snapshot + live deltas.
  const drivers = useMemo(
    () => (query.data || []).map((d) => ({ ...d, ...(moved[d.id] || {}) })),
    [query.data, moved]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set();
    drivers.forEach((d) => {
      if (d.lat == null || d.lng == null) return;
      seen.add(d.id);
      const busy = d.status !== 'idle';
      const existing = markers.current.get(d.id);
      if (existing) {
        existing.setLatLng([d.lat, d.lng]);
        existing.setIcon(carIcon(d.heading || 0, busy));
      } else {
        const m = L.marker([d.lat, d.lng], { icon: carIcon(d.heading || 0, busy) })
          .addTo(map)
          .bindPopup(`<b>${d.name}</b><br/>${d.vehicleType} · ${d.plate || '—'}<br/>${busy ? 'On a trip' : 'Idle'}`);
        markers.current.set(d.id, m);
      }
    });
    markers.current.forEach((m, id) => {
      if (seen.has(id)) return;
      map.removeLayer(m);
      markers.current.delete(id);
    });
  }, [drivers]);

  const busy = drivers.filter((d) => d.status !== 'idle').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader icon={Radio} title="Live map" subtitle="Every captain on the road right now." />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Online" value={drivers.length} icon={Car} />
        <Stat label="On a trip" value={busy} icon={Radio} />
        <Stat label="Idle" value={drivers.length - busy} icon={Car} />
      </div>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">Fleet positions</p>
            <Badge tone={connected ? 'success' : 'warning'} dot>
              {connected ? <><Wifi size={11} /> Live</> : <><WifiOff size={11} /> Polling</>}
            </Badge>
          </div>
          <div ref={holderRef} className="h-[60vh] min-h-[380px] w-full overflow-hidden rounded-xl border border-ink-200" />
          <p className="text-xs text-ink-400">
            Positions stream over a socket and are refreshed from the database every 30s, so the map still fills in if the stream drops.
          </p>
        </CardBody>
      </Card>

      <QueryBoundary query={query} loading={<LoadingScreen label="Loading fleet…" />} isEmpty={(d) => !d.length}
        empty={<EmptyState icon={Car} title="No captains online" message="Positions appear here as soon as a captain goes online with location on." />}>
        {() => (
          <Card>
            <CardBody className="divide-y divide-ink-100">
              {drivers.map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${d.status === 'idle' ? 'bg-ink-300' : 'bg-accent'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{d.name}</p>
                    <p className="truncate text-xs text-ink-500">{d.vehicleType} · {d.plate || '—'}{d.headingTo ? ` · → ${d.headingTo}` : ''}</p>
                  </div>
                  {d.speedKph != null && <span className="shrink-0 text-xs text-ink-500">{d.speedKph} km/h</span>}
                  <Badge tone={d.status === 'idle' ? 'neutral' : 'success'}>{d.status === 'idle' ? 'Idle' : 'On trip'}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </QueryBoundary>
    </div>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon size={18} /></span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
          <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}
