import { Metadata } from 'next';
import ProfileClient from './pclient';

export const metadata: Metadata = {
  title: 'profile',
};

export default function ProfilePage() {
  return <ProfileClient />;
}