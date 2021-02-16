import {
  BufferAttribute,
  BufferGeometry,
  Color,
  InterleavedBufferAttribute,
  TorusGeometry,
} from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';

/**
 * Tests if we are in a browser and have a window object.
 * @type {boolean}
 */
export const hasWindow =
  typeof window !== `undefined` && typeof window.document !== `undefined`;

/**
 * Takes a TorusGeometry and calculates positions & colors of individual particles.
 *
 * @param particleSize
 * @returns {[]}
 */
export const calculateTorusProperties = (
  particleSize: number,
): [BufferAttribute | InterleavedBufferAttribute, any, any] => {
  let bufferGeometry: BufferGeometry = new TorusGeometry(60, 45, 160, 160);

  // if normal and uv attributes are not removed,
  // mergeVertices() can't consolidate identical vertices
  // with different normal/uv data

  bufferGeometry.deleteAttribute('normal');
  bufferGeometry.deleteAttribute('uv');

  bufferGeometry = BufferGeometryUtils.mergeVertices(bufferGeometry);

  const positionAttribute:
    | BufferAttribute
    | InterleavedBufferAttribute = bufferGeometry.getAttribute('position');

  const colors: number[] | undefined = [];
  const sizes = [];

  const color = new Color();

  for (let i = 0, l = positionAttribute.count; i < l; i++) {
    color.setHSL(0.01 + 0.1 * (i / l), 0.5, 1.0);
    color.toArray(colors, i * 3);
    sizes[i] = particleSize * 0.3;
  }

  return [positionAttribute, colors, sizes];
};

export const vertexShader = `
      attribute float size;
      attribute vec3 customColor;

      varying vec3 vColor;

      void main() {
      	vColor = customColor;
      	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      	gl_PointSize = size * ( 300.0 / -mvPosition.z );
      	gl_Position = projectionMatrix * mvPosition;
      }
`;

export const fragmentShader = `
      uniform vec3 color;
      uniform sampler2D pointTexture;

      varying vec3 vColor;

      void main() {
      	gl_FragColor = vec4( color * vColor, 1.0 );
      	gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
      	if ( gl_FragColor.a < ALPHATEST ) discard;
      }
`;
