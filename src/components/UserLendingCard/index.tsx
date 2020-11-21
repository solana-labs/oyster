import React from "react";
import {
  useCollateralBalance,
  useTokenName,
  useUserBalance,
} from "./../../hooks";
import { LendingReserve } from "../../models/lending";
import { formatNumber } from "../../utils/utils";
import { Button, Card, Typography } from "antd";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";

const { Text } = Typography;

export const UserLendingCard = (props: {
  className?: string;
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const reserve = props.reserve;
  const address = props.address;

  const name = useTokenName(reserve?.liquidityMint);

  const { balance: tokenBalance } = useUserBalance(props.reserve.liquidityMint);
  const { balance: collateralBalance } = useCollateralBalance(props.reserve);

  // TODO: calculate
  const borrowed = 0;
  const healthFactor = "--";
  const ltv = 0;
  const available = 0;

  return (
    <Card
      className={props.className}
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "1.2rem",
            justifyContent: "center",
          }}
        >
          Your Information
        </div>
      }
    >
      <h3>Borrows</h3>

      <div className="card-row">
        <Text type="secondary" className="card-cell ">
          Borrowed
        </Text>
        <div className="card-cell ">
          {formatNumber.format(borrowed)} {name}
        </div>
      </div>

      <div className="card-row">
        <Text type="secondary" className="card-cell ">
          Health factor:
        </Text>
        <div className="card-cell ">{healthFactor}</div>
      </div>

      <div className="card-row">
        <Text type="secondary" className="card-cell ">
          Loan to value:
        </Text>
        <div className="card-cell ">{formatNumber.format(ltv)}</div>
      </div>

      <div className="card-row">
        <Text type="secondary" className="card-cell ">
          Available to you:
        </Text>
        <div className="card-cell ">
          {formatNumber.format(available)} {name}
        </div>
      </div>

      <h3>Deposits</h3>

      <div className="card-row">
        <Text type="secondary" className="card-cell ">
          Wallet balance:
        </Text>
        <div className="card-cell ">
          {formatNumber.format(tokenBalance)} {name}
        </div>
      </div>

      <div className="card-row">
        <Text type="secondary" className="card-cell ">
          You already deposited:
        </Text>
        <div className="card-cell ">
          {formatNumber.format(collateralBalance)} {name}
        </div>
      </div>

      <div
        className="card-row"
        style={{ marginTop: 20, justifyContent: "space-evenly" }}
      >
        <Link to={`/deposit/${address}`}>
          <Button>Deposit</Button>
        </Link>
        <Link to={`/borrow/${address}`}>
          <Button>Borrow</Button>
        </Link>
        <Link to={`/withdraw/${address}`}>
          <Button>Withdraw</Button>
        </Link>
        <Link to={`/repay/${address}`}>
          <Button disabled={true}>Repay</Button>
        </Link>
      </div>
    </Card>
  );
};
