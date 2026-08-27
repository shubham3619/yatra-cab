// Trip-type illustrations. A one-way trip is a single black carriageway with
// one white arrow; a round trip is a dual carriageway with white arrows in both
// directions and the YatraCab mark at the turnaround — so the difference reads
// instantly, without needing to parse the label.

const ROAD = '#0a0a0a';
const PAINT = '#ffffff';

function Mark({ x, y, r = 14 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={PAINT} />
      <circle r={r} fill="none" stroke={ROAD} strokeWidth="1.5" opacity="0.25" />
      <path
        d="M-6 -1h12M-4.2 -1a4.2 4.2 0 0 1 8.4 0M-3.6 2.8a1.5 1.5 0 1 0 0-.01M3.6 2.8a1.5 1.5 0 1 0 0-.01"
        fill="none"
        stroke={ROAD}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  );
}

export function OneWayRoad({ className }) {
  const path = 'M14 152 C 92 152, 122 44, 306 38';
  return (
    <svg viewBox="4 22 312 142" className={className} role="img" aria-label="One-way trip: a single road running in one direction">
      {/* asphalt */}
      <path d={path} fill="none" stroke={ROAD} strokeWidth="30" strokeLinecap="round" />
      {/* white centre line */}
      <path d={path} fill="none" stroke={PAINT} strokeWidth="2.5" strokeDasharray="12 14" strokeLinecap="round" opacity="0.9" />
      {/* direction of travel */}
      <path d="M244 27 l20 5 -19 8" fill="none" stroke={PAINT} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14" cy="152" r="7" fill={PAINT} />
      <circle cx="14" cy="152" r="3" fill={ROAD} />
      <Mark x={300} y={38} r={13} />
    </svg>
  );
}

export function RoundTripRoad({ className }) {
  const out = 'M16 120 C 96 120, 126 40, 300 36';
  const back = 'M20 148 C 100 148, 130 68, 304 64';
  return (
    <svg viewBox="4 20 316 140" className={className} role="img" aria-label="Round trip: a dual road going out and coming back">
      {/* two black carriageways */}
      <path d={out} fill="none" stroke={ROAD} strokeWidth="19" strokeLinecap="round" />
      <path d={back} fill="none" stroke={ROAD} strokeWidth="19" strokeLinecap="round" />
      {/* lane paint */}
      <path d={out} fill="none" stroke={PAINT} strokeWidth="2" strokeDasharray="9 11" opacity="0.85" />
      <path d={back} fill="none" stroke={PAINT} strokeWidth="2" strokeDasharray="9 11" opacity="0.85" />
      {/* outbound + return arrows */}
      <path d="M232 28 l19 5 -18 8" fill="none" stroke={PAINT} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M92 146 l-19 -5 18 -8" fill="none" stroke={PAINT} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="120" r="6.5" fill={PAINT} />
      <circle cx="16" cy="120" r="2.8" fill={ROAD} />
      <Mark x={302} y={49} r={15} />
    </svg>
  );
}
