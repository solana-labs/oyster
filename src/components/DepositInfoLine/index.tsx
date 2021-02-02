import React, { useMemo } from "react";
import {
  useTokenName,
  useUserBalance,
  useUserCollateralBalance,
} from "./../../hooks";
import { calculateDepositAPY, LendingReserve } from "../../models/lending";
import { formatNumber, formatPct } from "../../utils/utils";
import { Card, Col, Row, Statistic } from "antd";
import "./style.less";
import { PublicKey } from "@solana/web3.js";
import { GUTTER } from "../../constants";

export const DepositInfoLine = (props: {
  className?: string;
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const { balance: tokenBalance } = useUserBalance(props.reserve.liquidityMint);
  const { balance: collateralBalance } = useUserCollateralBalance(
    props.reserve
  );
  const depositAPY = useMemo(() => calculateDepositAPY(props.reserve), [
    props.reserve,
  ]);

  return (
    <Row gutter={GUTTER}>
      <Col xs={24} xl={5}>
        <Card className={props.className}>
          <Statistic
            title="Your balance in Oyster"
            value={formatNumber.format(collateralBalance)}
            suffix={name}
          />
        </Card>
      </Col>
      <Col xs={24} xl={5}>
        <Card className={props.className}>
          <Statistic
            title="Your wallet balance"
            value={formatNumber.format(tokenBalance)}
            suffix={name}
          />
        </Card>
      </Col>
      <Col xs={24} xl={5}>
        <Card className={props.className}>
          <Statistic title="Health Factor" value="--" />
        </Card>
      </Col>
      <Col xs={24} xl={9}>
        <Card className={props.className}>
          <Statistic title="APY" value={formatPct.format(depositAPY)} />
        </Card>
      </Col>
    </Row>
  );
};
