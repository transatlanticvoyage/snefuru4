import { Metadata } from 'next';
import AddressFlipperClient from './pclient';

export const metadata: Metadata = {
  title: 'Address Flipper',
};

export default function AddressFlipperPage() {
  return <AddressFlipperClient />;
}