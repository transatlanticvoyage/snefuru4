import { Metadata } from 'next';
import Haccjar2Client from './pclient';

export const metadata: Metadata = {
  title: 'haccjar2',
};

export default function Haccjar2Page() {
  return <Haccjar2Client />;
}