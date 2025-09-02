import { Metadata } from 'next';
import DFSAutofetchSettingsClient from './pclient';

export const metadata: Metadata = {
  title: 'DFS Autofetch Settings - Admin',
};

export default function DFSAutofetchSettingsPage() {
  return <DFSAutofetchSettingsClient />;
}