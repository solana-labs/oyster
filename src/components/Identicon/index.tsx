import React, { useEffect, useRef } from "react";

import Jazzicon from "jazzicon";
import bs58 from "bs58";
import "./style.less";

export const Identicon = (props: {
  address?: string;
  style?: React.CSSProperties;
  className?: string;
}) => {
  const { address, style } = props;
  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    if (address && ref.current) {
      ref.current.innerHTML = "";
      ref.current.className = props.className || "";
      ref.current.appendChild(
        Jazzicon(
          style?.width || 16,
          parseInt(bs58.decode(address).toString("hex").slice(5, 15), 16)
        )
      );
    }
  }, [address, style, props.className]);

  return (
    <div className="identicon-wrapper" ref={ref as any} style={props.style} />
  );
};
