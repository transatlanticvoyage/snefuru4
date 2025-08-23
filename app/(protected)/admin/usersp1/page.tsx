import { Metadata } from 'next';
import UsersP1Client from './pclient';

export const metadata: Metadata = {
  title: '/admin/usersp1 - Snefuru',
};

export default function UsersP1Page() {
  return <UsersP1Client />;
}