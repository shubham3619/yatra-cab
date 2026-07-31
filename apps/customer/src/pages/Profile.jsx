import { useState } from 'react';
import { useAuth, Card, CardHeader, CardBody, Button, Field, Input, Select, StarRating, toast } from '@yatracab/ui';
import {
  User, ShieldAlert, Phone, Sparkles,
  Music, VolumeX, Headphones, MessageCircle, Briefcase, Coffee, Ban, PawPrint,
} from 'lucide-react';
import { api } from '../api.js';

const VIBES = [
  { key: 'music_lover', label: 'Music lover', icon: Music },
  { key: 'silent_zone', label: 'Silent zone', icon: VolumeX },
  { key: 'podcast_fan', label: 'Podcast fan', icon: Headphones },
  { key: 'chatty', label: 'Chatty', icon: MessageCircle },
  { key: 'work_mode', label: 'Work mode', icon: Briefcase },
  { key: 'foodie', label: 'Foodie / chai', icon: Coffee },
  { key: 'non_smoker', label: 'Non-smoker', icon: Ban },
  { key: 'pet_friendly', label: 'Pet friendly', icon: PawPrint },
];
const MAX_VIBES = 6;

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [emergencyContact, setEmergency] = useState(user?.emergencyContact || '');
  const [gender, setGender] = useState(user?.gender || 'unspecified');
  const [vibes, setVibes] = useState(Array.isArray(user?.vibes) ? user.vibes : []);
  const [busy, setBusy] = useState(false);

  const toggleVibe = (key) => {
    setVibes((prev) => {
      if (prev.includes(key)) return prev.filter((v) => v !== key);
      if (prev.length >= MAX_VIBES) {
        toast.error(`Pick up to ${MAX_VIBES} vibes`);
        return prev;
      }
      return [...prev, key];
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.patch('/customer/profile', {
        name,
        email: email || undefined,
        emergencyContact,
        gender,
        vibes,
      });
      setUser(res.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-semibold text-ink-900">Profile</h1>

      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-2xl font-semibold text-accent">
            {(user?.name || 'Y')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-ink-900">{user?.name || 'Rider'}</p>
            <p className="flex items-center gap-1.5 text-sm text-ink-500"><Phone size={13} /> {user?.phone}</p>
            <div className="mt-1"><StarRating value={user?.rating || 5} count={user?.ratingCount} /></div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Personal details" icon={User} />
        <CardBody>
          <form onSubmit={save} className="space-y-4">
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Email" hint="for receipts & OTP">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Gender" hint="powers women-only rides">
              <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="unspecified">Prefer not to say</option>
              </Select>
            </Field>
            <Field label="Emergency contact (SOS)" hint="for safety">
              <Input value={emergencyContact} onChange={(e) => setEmergency(e.target.value)} placeholder="Family member's phone" />
            </Field>

            {/* Ride vibes */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink-700">
                <Sparkles size={15} className="text-accent" /> Ride vibe
                <span className="text-xs font-normal text-ink-400">· pick up to {MAX_VIBES} ({vibes.length}/{MAX_VIBES})</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {VIBES.map((v) => {
                  const on = vibes.includes(v.key);
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => toggleVibe(v.key)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                        on ? 'border-accent bg-accent-soft text-accent' : 'border-ink-200 text-ink-600 hover:border-accent/40'
                      }`}
                    >
                      <v.icon size={14} /> {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" loading={busy}>Save changes</Button>
          </form>
        </CardBody>
      </Card>

      <div className="flex items-start gap-2 rounded-xl bg-info-soft p-4 text-sm text-info">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
        Your phone number is never shared with drivers. Calls are connected through a masked YatraCab number.
      </div>
    </div>
  );
}
