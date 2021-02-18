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
}: {
  onCreated: any;
  children: React.ReactNode;
}) => (
  <>
    <WormholeCanvas onCreated={onCreated} />
    <div className="wormhole-overlay">{children}</div>
  </>
);

export default Wormhole;
