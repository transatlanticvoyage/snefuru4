import { Metadata } from 'next';
import Fapikeys1Client from './pclient';

export const metadata: Metadata = {
  title: 'fapikeys1 - Snefuru',
};

export default function Fapikeys1Page() {
  return <Fapikeys1Client />;
}