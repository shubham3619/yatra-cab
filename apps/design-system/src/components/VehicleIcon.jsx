import { Car, CarFront, Truck, Bus } from 'lucide-react';
import { cn } from '../lib/cn.js';

// The interface is monochrome by design — vehicle category is the ONE thing
// that still carries colour, so riders can tell classes apart at a glance.
export const VEHICLE_META = {
  hatchback: { icon: Car, color: '#2563eb', label: 'Hatchback' },
  sedan: { icon: CarFront, color: '#059669', label: 'Sedan' },
  suv: { icon: Truck, color: '#d97706', label: 'SUV' },
  tempo: { icon: Bus, color: '#7c3aed', label: 'Tempo Traveller' },
};

export function VehicleIcon({ type, size = 18, className, muted = false }) {
  const meta = VEHICLE_META[type] || VEHICLE_META.sedan;
  const Icon = meta.icon;
  return (
    <Icon
      size={size}
      className={cn('yc-keep-color shrink-0', className)}
      style={{ color: muted ? undefined : meta.color }}
    />
  );
}
