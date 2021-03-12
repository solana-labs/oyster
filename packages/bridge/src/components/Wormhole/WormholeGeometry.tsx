import * as React from 'react';
import { Color, Float32BufferAttribute } from 'three';
import type { Mesh, BufferGeometry } from 'three';
import { useTexture } from '@react-three/drei';
import { useFrame, useUpdate } from 'react-three-fiber';

import {
  calculateTorusProperties,
  fragmentShader,
  vertexShader,
} from './Utils';
import disc from './disc.png';

// The individual "particle size".
const PARTICLE_SIZE = 10;

/**
 * Three JS Point Geometry calculating points around a Torus.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const WormholeGeometry = ({ rotate }: { rotate?: boolean }) => {
  const mesh = React.useRef<Mesh>();
  const pointTexture = useTexture(disc);

  // The uniforms for the shaderMaterial.
  const uniforms = React.useMemo(
    () => ({
      // Adapt the color of the WormholeCanvas here.
      color: { value: new Color('dimgrey') },
      pointTexture: {
        value: pointTexture,
      },
    }),
    [pointTexture],
  );

  // The calculated torus properties.
  const [positionAttribute, colors, sizes] = React.useMemo(
    () => calculateTorusProperties(PARTICLE_SIZE),
    [],
  );

  // Rotate mesh around the y axis every frame.
  useFrame(() => {
    if (mesh.current) {
      // x-Axis defines the "top" we're looking at, try e.g. 30.5
      mesh.current.rotation.x = 30;
      if (rotate) {
        mesh.current.rotation.z += 0.0005;
      }
    }
  });

  // Calculate the geometry.
  const geometry = useUpdate((geo: BufferGeometry) => {
    geo.setAttribute('position', positionAttribute);
    geo.setAttribute('customColor', new Float32BufferAttribute(colors, 3));
    geo.setAttribute('size', new Float32BufferAttribute(sizes, 1));
  }, []);

  return (
    <points ref={mesh}>
      <bufferGeometry ref={geometry} attach="geometry" />
      <shaderMaterial
        attach="material"
        uniforms={uniforms}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        // The lower this value, the "harder" the discs' borders.
        alphaTest={0.9}
        // blending={THREE.AdditiveBlending}
        // transparent
      />
    </points>
  );
};

export default WormholeGeometry;
