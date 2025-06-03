"use client";
import StatusJar1 from './components/StatusJar1';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'statusjar1',
};

export default function StatusJar1Page() {
  return <StatusJar1 />;
} 