import { Metadata } from 'next';
import NarpividClient from './pclient';

export const metadata: Metadata = {
  title: 'narpivid - Snefuru',
};

export default function NarpividPage() {
  return <NarpividClient />;
}