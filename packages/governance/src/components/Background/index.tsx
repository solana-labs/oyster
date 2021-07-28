import * as CANNON from 'cannon';
import React from 'react';
import { Canvas } from 'react-three-fiber';
import { useCannon, Provider } from './useCannon';
import './styles.less';

function Plane({ position }: { position: any }) {
  // Register plane as a physics body with zero mass
  const ref = useCannon({ mass: 0 }, (body: any) => {
    body.addShape(new CANNON.Plane());
    body.position.set(...position);
  });
  return (
    <mesh ref={ref} receiveShadow>
      <planeBufferGeometry attach="geometry" args={[1000, 1000]} />
      <meshPhongMaterial attach="material" color="#272727" />
    </mesh>
  );
}

function Box({ position }: { position: any }) {
  // Register box as a physics body with mass
  const ref = useCannon({ mass: 100000 }, (body: any) => {
    body.addShape(new CANNON.Box(new CANNON.Vec3(1, 1, 1)));
    body.position.set(...position);
  });
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry attach="geometry" args={[2, 2, 2]} />
      <meshStandardMaterial attach="material" />
    </mesh>
  );
}

export const Background = () => {
  return (
    <Canvas
      className="main"
      shadowMap
      camera={{ position: [0, 0, 20] }}
      style={{ width: '100%', height: 400, marginTop: -120, zIndex: 1 }}
    >
      <ambientLight intensity={0.5} />
      <spotLight
        intensity={0.6}
        position={[30, 30, 50]}
        angle={0.2}
        penumbra={1}
        castShadow
      />
      <Provider>
        <Plane position={[0, 0, -10]} />
        <Box position={[1, 0, -8]} />
        <Box position={[5, 1, -8]} />
        <Box position={[2, 1, -8]} />
        <Box position={[0, 0, -9]} />
        <Box position={[0, 0, -9]} />
      </Provider>
    </Canvas>
  );
};
