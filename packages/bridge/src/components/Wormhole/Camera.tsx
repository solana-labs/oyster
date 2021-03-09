import * as React from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import { hasWindow } from './Utils';

/**
 * Creates the perspective Camera for our WormholeCanvas.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const Camera = () => {
  const cameraAspect = hasWindow ? window.innerWidth / window.innerHeight : 1;
  return (
    <PerspectiveCamera
      // Registers it as the default camera system-wide (default=false)
      makeDefault
      fov={45}
      aspect={cameraAspect}
      near={1}
      far={10000}
      position={[0, 0, 100]}
    />
  );
};

export default Camera;
