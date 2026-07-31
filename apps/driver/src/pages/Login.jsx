import { useNavigate } from 'react-router-dom';
import { useAuth, AuthScreen } from '@yatracab/ui';
import { Navigation, IndianRupee, TrendingUp, Award } from 'lucide-react';
import { api } from '../api.js';

const HERO = {
  title: 'Drive more.\nKeep more.',
  subtitle:
    'Join YatraCab as a Captain and get booked for the routes you already run — with almost the whole fare in your pocket.',
  highlights: [
    { icon: IndianRupee, title: 'Keep the full fare', text: 'No 20–40% commission — just a small platform fee the rider pays.' },
    { icon: TrendingUp, title: 'Steady demand', text: 'Get trip alerts for your routes and vehicle — fewer empty legs.' },
    { icon: Award, title: 'Loyalty rewards', text: 'Earn points on every app-completed ride.' },
  ],
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <AuthScreen
      api={api}
      role="driver"
      roleNoun="Captain"
      brand={{ mark: Navigation, name: 'YatraCab', tagline: 'Captain partner' }}
      hero={HERO}
      demoHint="Demo: 9000000020 (approved) · 9000000023 (pending) · OTP 123456"
      onAuthed={async (user, token) => {
        await login(user, token);
        navigate('/');
      }}
    />
  );
}
