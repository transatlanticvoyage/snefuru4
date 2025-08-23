import { Metadata } from 'next';
import CityjarClient from './pclient';

export const metadata: Metadata = {
  title: '/cityjar',
};

export default function CityjarPage() {
  return <CityjarClient />;
}