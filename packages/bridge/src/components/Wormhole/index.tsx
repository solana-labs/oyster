import * as React from 'react';
import WormholeCanvas from './WormholeCanvas';
import './wormhole.less';

/**
 * Wormhole encapsulation component.
 *
 * @param onCreated {any}               Function called when Canvas is ready.
 * @param children  {React.ReactNode}   Elements to show above the Wormhole.
 * @constructor
 */
const Wormhole = ({
  onCreated,
  children,
  show,
  rotate,
}: {
  onCreated: any;
  show: boolean;
  rotate?: boolean;
  children: React.ReactNode;
}) =>
  !show ? (
    <>{children}</>
  ) : (
    <>
      <WormholeCanvas onCreated={onCreated} rotate={rotate} />
      <div className="wormhole-overlay">{children}</div>
    </>
  );

export default Wormhole;
