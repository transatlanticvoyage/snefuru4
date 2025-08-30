import { Metadata } from 'next';
import AddressjarClient from './pclient';

export const metadata: Metadata = {
  title: '/addressjar',
};

export default function AddressjarPage() {
  return <AddressjarClient />;
}