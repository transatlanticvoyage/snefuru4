import { Metadata } from 'next';
import YoshidexManagerClient from './pclient';

export const metadata: Metadata = {
  title: 'Yoshidex Manager - Snefuru',
};

export default function YoshidexManagerPage() {
  return <YoshidexManagerClient />;
}