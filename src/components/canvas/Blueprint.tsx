import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Line } from '@react-three/drei';
import { useStore, useChatStore, SchemaNode } from '../../lib/store';

const BlueprintNode = ({ node, opacityRef }: { node: SchemaNode, opacityRef: React.MutableRefObject<number> }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const textMaterialRef = useRef<any>(null);
  const coreMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, node.position[0], 2 * delta);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, node.position[1], 2 * delta);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, node.position[2], 2 * delta);
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
    if (materialRef.current) {
      materialRef.current.opacity = opacityRef.current * 0.3;
    }
    if (coreMaterialRef.current) {
      coreMaterialRef.current.opacity = opacityRef.current;
    }
    if (textMaterialRef.current) {
        textMaterialRef.current.opacity = opacityRef.current;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshBasicMaterial ref={materialRef} color="#00ff88" wireframe transparent opacity={0} />
      </mesh>
      
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial ref={coreMaterialRef} color="#00ff88" transparent opacity={0} />
      </mesh>

      <Text
        position={[0, 0.8, 0]}
        fontSize={0.25}
        color="#00ff88"
        anchorX="center"
        anchorY="bottom"
        font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwI.woff"
      >
        <meshBasicMaterial ref={textMaterialRef} color="#00ff88" transparent opacity={0} depthWrite={false} />
        {node.label}
      </Text>
    </group>
  );
};

export const Blueprint = () => {
  const { mode } = useStore();
  const { latestSchema } = useChatStore();
  const groupRef = useRef<THREE.Group>(null);
  const targetOpacity = useRef(0);
  const currentOpacity = useRef(0);

  const defaultNodes: SchemaNode[] = [
    { id: 'root', label: 'RootLayout', position: [0, 3, 0] },
    { id: 'page', label: 'App', position: [0, 1, 0] },
    { id: 'canvas', label: 'WebGLContext', position: [-2, -1, 0] },
    { id: 'dom', label: 'DOMOverlay', position: [2, -1, 0] },
    { id: 'scene', label: 'Scene', position: [-2, -3, 0] },
    { id: 'ui', label: 'Interface', position: [2, -3, 0] },
    { id: 'store', label: 'ZustandStore', position: [0, -4, 0] },
  ];

  const defaultLinks = [
    { source: [0, 3, 0], target: [0, 1, 0] },
    { source: [0, 1, 0], target: [-2, -1, 0] },
    { source: [0, 1, 0], target: [2, -1, 0] },
    { source: [-2, -1, 0], target: [-2, -3, 0] },
    { source: [2, -1, 0], target: [2, -3, 0] },
    { source: [-2, -3, 0], target: [0, -4, 0] },
    { source: [2, -3, 0], target: [0, -4, 0] },
  ];

  const nodes = latestSchema.nodes.length > 0 ? latestSchema.nodes : defaultNodes;
  const links = latestSchema.links.length > 0 ? latestSchema.links : defaultLinks;

  useFrame((state, delta) => {
    targetOpacity.current = mode === 'builder' ? 1 : 0;
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity.current, 5 * delta);

    if (groupRef.current) {
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, mode === 'builder' ? 1 : -5, 2 * delta);
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, mode === 'builder' ? -2 : -10, 2 * delta);
        groupRef.current.visible = currentOpacity.current > 0.01;
        
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {links.map((link, i) => (
        <Line
          key={`link-${i}-${link.source.join(',')}-${link.target.join(',')}`}
          points={[link.source as [number, number, number], link.target as [number, number, number]]}
          color="#00ff88"
          lineWidth={2}
          dashed={true}
          dashSize={0.2}
          gapSize={0.1}
          transparent
        />
      ))}
      
      {nodes.map((node) => (
        <BlueprintNode key={node.id} node={node} opacityRef={currentOpacity} />
      ))}
    </group>
  );
};
