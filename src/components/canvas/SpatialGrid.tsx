import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../lib/store';

export const SpatialGrid = () => {
  const gridRef = useRef<any>(null);
  const state = useStore((state) => state);
  const { hasCriticalVulnerability, mode } = state;

  useEffect(() => {
    return () => {
      if (gridRef.current && gridRef.current.material) {
        gridRef.current.material.dispose();
      }
    };
  }, []);

  useFrame((state) => {
    if (gridRef.current) {
      // Slowly move grid down to create infinite effect
      gridRef.current.position.z = (state.clock.elapsedTime * 0.5) % 1;
    }
  });

  const sectionColor = hasCriticalVulnerability ? "#ff3366" : (mode === 'builder' ? "#00ff88" : "#00f0ff");
  const cellColor = hasCriticalVulnerability ? "#ffaaaa" : (mode === 'builder' ? "#88ffcc" : "#ffffff");

  return (
    <Grid
      ref={gridRef}
      infiniteGrid
      fadeDistance={30}
      sectionColor={sectionColor}
      sectionSize={1}
      cellColor={cellColor}
      cellSize={0.2}
      position={[0, -3, 0]}
    />
  );
};
