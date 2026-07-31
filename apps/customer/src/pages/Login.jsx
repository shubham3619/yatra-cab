import { useNavigate } from 'react-router-dom';
import { useAuth, AuthScreen } from '@yatracab/ui';
import { Car, ShieldCheck, BadgeIndianRupee, Gavel } from 'lucide-react';
import { api } from '../api.js';

const HERO = {
  title: 'Every journey, your way.',
  subtitle:
    'Book a fixed-fare cab or name your price with live driver bidding — for outstation trips and city rides. Verified drivers, transparent pricing, no surprises.',
  highlights: [
    { icon: ShieldCheck, title: 'Verified drivers', text: 'Background-checked, insured and rated by riders.' },
    { icon: BadgeIndianRupee, title: 'Transparent pricing', text: 'A small advance fee online; the rest is cash to the driver.' },
    { icon: Gavel, title: 'Fixed fares or bidding', text: 'Choose a set rate, or post a trip and compare quotes.' },
  ],
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <AuthScreen
      api={api}
      role="customer"
      roleNoun="Rider"
      brand={{ mark: Car, name: 'YatraCab', tagline: 'Rides, your way' }}
      hero={HERO}
      demoHint="Demo rider: phone 9000000010 · OTP 123456"
      onAuthed={async (user, token) => {
        await login(user, token);
        navigate('/');
      }}
    />
  );
}
