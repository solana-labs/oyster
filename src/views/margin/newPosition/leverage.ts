import { useEffect } from "react";
import { LABELS } from "../../../constants";
import { Position } from "./interfaces";
import { usePoolAndTradeInfoFrom } from "./utils";

export function useLeverage({
  newPosition,
  setNewPosition,
}: {
  newPosition: Position;
  setNewPosition: (pos: Position) => void;
}) {
  const {
    enrichedPools,
    collateralDeposit,
    collType,
    desiredType,
    collValue,
    desiredValue,
    leverage,
  } = usePoolAndTradeInfoFrom(newPosition);

  // Leverage validation - if you choose this leverage, is it allowable, with your buying power and with
  // the pool we have to cover you?
  useEffect(() => {
    if (!collType) {
      setNewPosition({ ...newPosition, error: LABELS.NO_COLL_TYPE_MESSAGE });
      return;
    }

    if (!collateralDeposit) {
      setNewPosition({ ...newPosition, error: LABELS.NO_DEPOSIT_MESSAGE });
      return;
    }

    if (
      !desiredType ||
      !newPosition.asset.value ||
      !enrichedPools ||
      enrichedPools.length === 0
    ) {
      return;
    }

    // If there is more of A than B
    const exchangeRate =
      enrichedPools[0].liquidityB / enrichedPools[0].liquidityA;
    const leverageDesired = newPosition.leverage;
    const amountAvailableInOysterForMargin =
      collateralDeposit.info.amount * exchangeRate;
    const amountToDepositOnMargin = desiredValue / leverageDesired;

    if (amountToDepositOnMargin > amountAvailableInOysterForMargin) {
      setNewPosition({
        ...newPosition,
        error: LABELS.NOT_ENOUGH_MARGIN_MESSAGE,
      });
      return;
    }

    if (amountToDepositOnMargin > collValue) {
      setNewPosition({ ...newPosition, error: LABELS.SET_MORE_MARGIN_MESSAGE });
      return;
    }

    const liqA = enrichedPools[0].liquidityA;
    const liqB = enrichedPools[0].liquidityB;
    const supplyRatio = liqA / liqB;

    // change in liquidity is amount desired (in units of B) converted to collateral units(A)
    const chgLiqA = desiredValue / exchangeRate;
    const newLiqA = liqA - chgLiqA;
    const newLiqB = liqB + desiredValue;
    const newSupplyRatio = newLiqA / newLiqB;

    const priceImpact = Math.abs(100 - 100 * (newSupplyRatio / supplyRatio));
    const marginToLeverage = 100 / leverageDesired; // Would be 20% for 5x
    if (marginToLeverage < priceImpact && leverageDesired !== 1) {
      // Obviously we allow 1x as edge case
      // if their marginToLeverage ratio < priceImpact, we say hey ho no go
      setNewPosition({ ...newPosition, error: LABELS.LEVERAGE_LIMIT_MESSAGE });
      return;
    }
    setNewPosition({ ...newPosition, error: "" });
  }, [
    collType,
    desiredType,
    desiredValue,
    leverage,
    enrichedPools,
    collValue,
    collateralDeposit,
  ]);
}
