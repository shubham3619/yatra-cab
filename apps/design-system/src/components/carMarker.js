/**
 * Map marker for a vehicle, shared by the rider and ops maps.
 *
 * Side profile rather than top-down: at ~30px a top-down car reads as a blob,
 * while a silhouette with a cabin and two wheels is unmistakably a car.
 *
 * Because it is a side view it is FLIPPED by direction of travel, not rotated.
 * Rotating a side-on car to a northerly heading would show it driving up a
 * wall; mirroring it left/right is how the direction actually reads.
 */
export const facesLeft = (heading) =>
  Number.isFinite(Number(heading)) && Number(heading) > 180 && Number(heading) < 360;

/**
 * @param {object}  opts
 * @param {number}  opts.heading  degrees, 0 = north
 * @param {boolean} opts.active   the ride being tracked / a car on a trip
 * @param {number}  opts.size     px
 */
export function carMarkerHtml({ heading, active = false, size = 30 } = {}) {
  const bg = active ? 'rgb(var(--yc-accent))' : '#1c1917';
  const flip = facesLeft(heading) ? ' scaleX(-1)' : '';
  const glyph = Math.round(size * 0.82);

  return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;
      border-radius:${Math.round(size * 0.3)}px;background:${bg};border:2px solid #fff;
      box-shadow:0 4px 12px -2px rgba(0,0,0,.45);transform:${flip || 'none'};transition:transform .3s ease">
      <svg width="${glyph}" height="${glyph}" viewBox="0 0 32 32">
        <path d="M3.2 21.2v-2.4c0-1.3.7-2.1 2-2.4l4.6-.9c2.4-2.6 4.7-3.9 7.2-3.9h2.6c2.3 0 4.2 1 5.7 3l1.9 2.4 1.6.4c1.3.3 2 1.1 2 2.4v1.4z" fill="#fff"/>
        <circle cx="10.2" cy="21.4" r="3.6" fill="#fff"/><circle cx="10.2" cy="21.4" r="1.7" fill="${bg}"/>
        <circle cx="23.2" cy="21.4" r="3.6" fill="#fff"/><circle cx="23.2" cy="21.4" r="1.7" fill="${bg}"/>
        <path d="M12.2 15.2c1.8-1.7 3.5-2.5 5.2-2.5h1.9c1.6 0 3 .8 4.1 2.5z" fill="${bg}"/>
      </svg></div>`;
}
