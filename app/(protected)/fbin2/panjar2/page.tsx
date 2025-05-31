'use client';

import { useState } from 'react';
import Panjar2UI from './components/panjar2';
import { ImageRecord } from './types';

export default function Panjar2Page() {
  const [images, setImages] = useState<ImageRecord[]>([]);

  return (
    <Panjar2UI images={images} />
  );
} 