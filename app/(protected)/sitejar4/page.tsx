import { Metadata } from 'next';
import Sitejar4Client from './pclient';

export const metadata: Metadata = {
  title: '/sitejar4',
};

export default function Sitejar4Page() {
  return <Sitejar4Client />;
}