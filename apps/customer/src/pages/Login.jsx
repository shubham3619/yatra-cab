import { useNavigate } from 'react-router-dom';
import { useAuth, AuthScreen } from '@yatracab/ui';
import { Car, ShieldCheck, BadgeIndianRupee, Gavel } from 'lucide-react';
import { api } from '../api.js';

const HERO = {
  title: 'Every journey, your way.',
  subtitle:
    'Tell us where and when. Verified drivers send you their quotes — you compare vehicle, rating and price, then pick the one you want. Outstation trips and city rides.',
  highlights: [
    { icon: ShieldCheck, title: 'Verified drivers', text: 'Background-checked, insured and rated by riders.' },
    { icon: BadgeIndianRupee, title: 'Transparent pricing', text: 'A small advance fee online; the rest is cash to the driver.' },
    { icon: Gavel, title: 'You choose the quote', text: 'Compare drivers on vehicle, rating and price — no fixed menu.' },
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
