import { Metadata } from 'next';
import MyHubClient from './pclient';

export const metadata: Metadata = {
  title: 'MyHub Account Settings',
};

export default function MyHubPage() {
  return <MyHubClient />;
}