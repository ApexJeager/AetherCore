import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../lib/store';

const vertexShader = `
uniform float uTime;
uniform float uIntensity;
attribute float size;
varying vec3 vPosition;

void main() {
  vec3 pos = position;
  float noise = sin(pos.x * 5.0 + uTime) * cos(pos.y * 5.0 + uTime);
  pos.z += noise * 0.5 * uIntensity;
  vPosition = pos;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + uIntensity * 0.5);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec3 uColorBase;
uniform vec3 uColorAccent;
uniform float uCritical;
varying vec3 vPosition;

void main() {
  float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
  if (distanceToCenter > 0.5) discard;

  float wave = sin(vPosition.z * 10.0 - uTime * 2.0);
  float mixVal = smoothstep(-1.0, 1.0, wave);
  vec3 finalColor = mix(uColorBase, uColorAccent, mixVal);
  
  if (uCritical > 0.5) {
    float flash = abs(sin(uTime * 5.0));
    finalColor = mix(finalColor, vec3(1.0, 0.2, 0.4), flash * 0.5);
  }
  
  float alpha = 1.0 - (distanceToCenter * 2.0);
  gl_FragColor = vec4(finalColor, alpha * 0.8);
}
`;

export const FluidWave = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const state = useStore((state) => state);
  const { hasCriticalVulnerability, isAnalyzing, mode } = state;

  const count = 10000;

  const [positions, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      sizes[i] = Math.random() * 0.5 + 0.1;
    }
    return [positions, sizes];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0.1 },
    uColorBase: { value: new THREE.Color('#000000') },
    uColorAccent: { value: new THREE.Color('#00f0ff') },
    uCritical: { value: 0.0 }
  }), []);

  useEffect(() => {
    return () => {
      if (pointsRef.current) {
        pointsRef.current.geometry.dispose();
      }
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      const targetIntensity = isAnalyzing ? 1.5 : (hasCriticalVulnerability ? 0.8 : 0.2);
      const targetCritical = hasCriticalVulnerability ? 1.0 : 0.0;
      
      materialRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uIntensity.value,
        targetIntensity,
        0.05
      );
      materialRef.current.uniforms.uCritical.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uCritical.value,
        targetCritical,
        0.1
      );
      
      const targetColor = mode === 'builder' ? new THREE.Color('#00ff88') : new THREE.Color('#00f0ff');
      materialRef.current.uniforms.uColorAccent.value.lerp(targetColor, 0.05);
    }
    
    if (pointsRef.current) {
      pointsRef.current.rotation.x = -Math.PI / 2.5;
    }
  });

  return (
    <points ref={pointsRef} position={[0, -2, -5]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
