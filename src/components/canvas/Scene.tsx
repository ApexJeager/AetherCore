import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { FluidWave } from './FluidWave';
import { SpatialGrid } from './SpatialGrid';
import { Blueprint } from './Blueprint';

export const Scene = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-auto">
      <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <FluidWave />
        <SpatialGrid />
        <Blueprint />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={2}
          maxDistance={15}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
