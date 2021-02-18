import * as React from 'react';
import { Canvas } from 'react-three-fiber';
import Camera from './Camera';
import WormholeGeometry from './WormholeGeometry';

/**
 * Three.js wormhole component.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const WormholeCanvas = ({ onCreated }: { onCreated: any }) => {
  return (
    <Canvas onCreated={onCreated}>
      <Camera />
      <React.Suspense fallback={null}>
        <WormholeGeometry />
      </React.Suspense>
    </Canvas>
  );
};

export default WormholeCanvas;
