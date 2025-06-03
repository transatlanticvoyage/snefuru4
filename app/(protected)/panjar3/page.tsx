'use client';

import Panjar3UI from './components/panjar3';
import { useEffect } from 'react';

export default function Panjar3Page() {
  useEffect(() => {
    // Set document title
    document.title = 'panjar3 - Snefuru';
  }, []);

  return <Panjar3UI />;
} 