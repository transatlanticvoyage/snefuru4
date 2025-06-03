"use client";
import StatusJar1 from './components/StatusJar1';
import { useEffect } from 'react';

export default function StatusJar1Page() {
  useEffect(() => {
    // Set document title
    document.title = 'statusjar1 - Snefuru';
  }, []);

  return <StatusJar1 />;
} 