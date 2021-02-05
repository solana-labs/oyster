import { Progress, Slider, Card, Statistic } from "antd";
import React, { useState } from "react";
import { Position } from "./interfaces";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import tokens from "../../../config/tokens.json";
import GainsChart from "./GainsChart";
import { usePoolAndTradeInfoFrom } from "./utils";

export default function Breakdown({ item }: { item: Position }) {
  const { enrichedPools, leverage } = usePoolAndTradeInfoFrom(item);

  const exchangeRate =
    enrichedPools.length === 0
      ? 1
      : enrichedPools[0].liquidityB / enrichedPools[0].liquidityA;

  let myPart = item.collateral.value || 0;
  const brokeragePart = (item.collateral.value || 0) * leverage - myPart;
  const brokerageColor = "brown";
  const myColor = "blue";
  const gains = "green";
  const losses = "red";
  const token = tokens.find(
    (t) => t.mintAddress === item.asset.type?.info?.liquidityMint?.toBase58()
  );
  const collateralToken = tokens.find(
    (t) =>
      t.mintAddress === item.collateral.type?.info?.liquidityMint?.toBase58()
  );

  const [myGain, setMyGain] = useState<number>(10);
  const profitPart = (myPart + brokeragePart) * (myGain / 100);
  let progressBar = null;
  if (profitPart > 0) {
    // normalize...
    const total = profitPart + myPart + brokeragePart;
    progressBar = (
      <Progress
        percent={(myPart / total) * 100 + (brokeragePart / total) * 100}
        success={{
          percent: (brokeragePart / total) * 100,
          strokeColor: brokerageColor,
        }}
        strokeColor={myColor}
        trailColor={gains}
        showInfo={false}
      />
    );
  } else {
    // now, we're eating away your profit...
    myPart += profitPart; // profit is negative
    const total = myPart + brokeragePart;
    if (myPart < 0) {
      progressBar = (
        <p>Your position has been liquidated at this price swing.</p>
      );
    } else
      progressBar = (
        <Progress
          showInfo={false}
          success={{
            percent: (brokeragePart / total) * 100,
            strokeColor: brokerageColor,
          }}
          trailColor={myColor}
        />
      );
  }

  return (
    <div className="new-position-item new-position-item-top-right">
      <Card className="new-position-item new-position-item-top-right">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          <Card>
            <Statistic
              title="Borrowed"
              value={brokeragePart * exchangeRate}
              precision={2}
              valueStyle={{ color: brokerageColor }}
              suffix={token?.tokenSymbol}
            />
          </Card>
          <Card>
            <Statistic
              title="My Collateral"
              value={myPart}
              precision={2}
              valueStyle={{ color: myColor }}
              suffix={collateralToken?.tokenSymbol}
            />
          </Card>
          <Card>
            <Statistic
              title="Profit/Loss"
              value={profitPart * exchangeRate}
              precision={2}
              valueStyle={{ color: profitPart > 0 ? gains : losses }}
              suffix={token?.tokenSymbol}
              prefix={
                profitPart > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />
              }
            />
          </Card>
        </div>
        <br />
        {progressBar}
      </Card>
      <Card className="new-position-item new-position-item-bottom-right">
        <GainsChart item={item} priceChange={myGain} />
        <Slider
          tooltipVisible={true}
          defaultValue={10}
          tipFormatter={(p) => <span>{p}%</span>}
          max={100}
          min={-100}
          tooltipPlacement={"top"}
          onChange={(v: number) => {
            setMyGain(v);
          }}
          style={{ marginBottom: "20px" }}
        />
      </Card>
    </div>
  );
}
