import { Metadata } from 'next';
import LoginClient from './pclient';

export const metadata: Metadata = {
  title: 'login - Snefuru',
};

export default function LoginPage() {
  return <LoginClient />;
} 