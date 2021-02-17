import * as React from "react";
import WormholeCanvas from "./WormholeCanvas";
import "./wormhole.less";

/**
 * Wormhole encapsulation component.
 *
 * @param children  {React.ReactNode}   Elements to show above the Wormhole.
 * @constructor
 */
const Wormhole = ({ children }: { children: React.ReactNode }) => (
  <>
    <WormholeCanvas />
    <div className="wormhole-overlay">{children}</div>
  </>
);

export default Wormhole;
