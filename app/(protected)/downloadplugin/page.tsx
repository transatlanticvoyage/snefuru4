import { Metadata } from 'next';
import DownloadPluginClient from './pclient';

export const metadata: Metadata = {
  title: 'Download Plugin - Snefuru',
};

export default function DownloadPluginPage() {
  return <DownloadPluginClient />;
}