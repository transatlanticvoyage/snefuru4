import { Metadata } from 'next';
import Mapping1Client from './pclient';

export const metadata: Metadata = {
  title: '/admin/mapping1 - Snefuru',
};

export default function Mapping1Page() {
  return <Mapping1Client />;
}