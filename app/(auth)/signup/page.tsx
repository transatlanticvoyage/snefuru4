import { Metadata } from 'next';
import SignUpClient from './pclient';

export const metadata: Metadata = {
  title: 'signup - Snefuru',
};

export default function SignUp() {
  return <SignUpClient />;
} 