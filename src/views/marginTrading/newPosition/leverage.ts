import { useEffect } from 'react';
import { LABELS } from '../../../constants';
import { useEnrichedPools } from '../../../contexts/market';
import { useUserDeposits } from '../../../hooks';
import { usePoolForBasket } from '../../../utils/pools';
import { Position } from './interfaces';

export function useLeverage({
  newPosition,
  setNewPosition,
}: {
  newPosition: Position;
  setNewPosition: (pos: Position) => void;
}) {
  const collType = newPosition.collateral;
  const desiredType = newPosition.asset.type;

  const pool = usePoolForBasket([
    collType?.info?.liquidityMint?.toBase58(),
    desiredType?.info?.liquidityMint?.toBase58(),
  ]);

  const userDeposits = useUserDeposits();
  const collateralDeposit = userDeposits.userDeposits.find(
    (u) => u.reserve.info.liquidityMint.toBase58() == collType?.info?.liquidityMint?.toBase58()
  );
  const enriched = useEnrichedPools(pool ? [pool] : []);

  // Leverage validation - if you choose this leverage, is it allowable, with your buying power and with
  // the pool we have to cover you?
  useEffect(() => {
    if (!collateralDeposit) {
      setNewPosition({ ...newPosition, error: LABELS.NO_DEPOSIT_MESSAGE });
      return;
    }

    if (!collType || !desiredType || !newPosition.asset.value || !enriched || enriched.length == 0) {
      return;
    }

    // If there is more of A than B
    const exchangeRate = enriched[0].liquidityB / enriched[0].liquidityA;
    const amountDesiredToPurchase = parseFloat(newPosition.asset.value);
    const leverageDesired = newPosition.leverage;
    const amountAvailableInOysterForMargin = collateralDeposit.info.amount * exchangeRate;
    const amountToDepositOnMargin = amountDesiredToPurchase / leverageDesired;

    if (amountToDepositOnMargin > amountAvailableInOysterForMargin) {
      setNewPosition({ ...newPosition, error: LABELS.NOT_ENOUGH_MARGIN_MESSAGE });
      return;
    }

    const liqA = enriched[0].liquidityA;
    const liqB = enriched[0].liquidityB;
    const supplyRatio = liqA / liqB;

    // change in liquidity is amount desired (in units of B) converted to collateral units(A)
    const chgLiqA = amountDesiredToPurchase / exchangeRate;
    const newLiqA = liqA - chgLiqA;
    const newLiqB = liqB + amountDesiredToPurchase;
    const newSupplyRatio = newLiqA / newLiqB;

    const priceImpact = Math.abs(100 - 100 * (newSupplyRatio / supplyRatio));
    const marginToLeverage = 100 / leverageDesired; // Would be 20% for 5x
    if (marginToLeverage < priceImpact && leverageDesired != 1) {
      // Obviously we allow 1x as edge case
      // if their marginToLeverage ratio < priceImpact, we say hey ho no go
      setNewPosition({ ...newPosition, error: LABELS.LEVERAGE_LIMIT_MESSAGE });
      return;
    }
    setNewPosition({ ...newPosition, error: '' });
  }, [collType, desiredType, newPosition.asset.value, newPosition.leverage, enriched]);
}
