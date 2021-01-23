import { Card, Row, Col } from "antd";
import React, { useMemo } from "react";
import { useMint } from "../../contexts/accounts";
import { useEnrichedPools } from "../../contexts/market";
import { useUserAccounts } from "../../hooks";
import { PoolInfo } from "../../models";
import { formatPriceNumber } from "../../utils/utils";

export const PoolPrice = (props: { pool: PoolInfo }) => {
  const pool = props.pool;
  const pools = useMemo(() => [props.pool].filter((p) => p) as PoolInfo[], [
    props.pool,
  ]);
  const enriched = useEnrichedPools(pools)[0];

  const { userAccounts } = useUserAccounts();
  const lpMint = useMint(pool.pubkeys.mint);

  const ratio =
    userAccounts
      .filter((f) => pool.pubkeys.mint.equals(f.info.mint))
      .reduce((acc, item) => item.info.amount.toNumber() + acc, 0) /
    (lpMint?.supply.toNumber() || 0);

  if (!enriched) {
    return null;
  }
  return (
    <Card
      className="ccy-input"
      style={{ borderRadius: 20, width: "100%" }}
      bodyStyle={{ padding: "7px" }}
      size="small"
      title="Prices and pool share"
    >
      <Row style={{ width: "100%" }}>
        <Col span={8}>
          {formatPriceNumber.format(
            parseFloat(enriched.liquidityA) / parseFloat(enriched.liquidityB)
          )}
        </Col>
        <Col span={8}>
          {formatPriceNumber.format(
            parseFloat(enriched.liquidityB) / parseFloat(enriched.liquidityA)
          )}
        </Col>
        <Col span={8}>
          {ratio * 100 < 0.001 && ratio > 0 ? "<" : ""}
          &nbsp;{formatPriceNumber.format(ratio * 100)}%
        </Col>
      </Row>
      <Row style={{ width: "100%" }}>
        <Col span={8}>
          {enriched.names[0]} per {enriched.names[1]}
        </Col>
        <Col span={8}>
          {enriched.names[1]} per {enriched.names[0]}
        </Col>
        <Col span={8}>Share of pool</Col>
      </Row>
    </Card>
  );
};
