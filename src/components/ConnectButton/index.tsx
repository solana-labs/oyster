import { Button } from "antd";
import { ButtonProps } from "antd/lib/button";
import React from "react";
import { useWallet } from "../../contexts/wallet";
import { LABELS } from "./../../constants";

export const ConnectButton = (
  props: ButtonProps & React.RefAttributes<HTMLElement>
) => {
  const { wallet, connected } = useWallet();
  const { onClick, children, ...rest } = props;
  return (
    <Button {...rest} onClick={connected ? onClick : wallet.connect}>
      {connected ? props.children : LABELS.CONNECT_LABEL}
    </Button>
  );
};
