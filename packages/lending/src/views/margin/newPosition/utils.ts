import { ParsedAccount } from '@oyster/common';
import { Reserve } from '@solana/spl-token-lending';
import { useEnrichedPools } from '../../../contexts/market';
import { UserDeposit, useUserDeposits } from '../../../hooks';
import { PoolInfo } from '../../../models';
import { usePoolForBasket } from '../../../utils/pools';
import { Position } from './interfaces';

export function usePoolAndTradeInfoFrom(
  newPosition: Position,
): {
  enrichedPools: any[];
  collateralDeposit: UserDeposit | undefined;
  collType: ParsedAccount<Reserve> | undefined;
  desiredType: ParsedAccount<Reserve> | undefined;
  collValue: number;
  desiredValue: number;
  leverage: number;
  pool: PoolInfo | undefined;
} {
  const collType = newPosition.collateral.type;
  const desiredType = newPosition.asset.type;
  const collValue = newPosition.collateral.value || 0;
  const desiredValue = newPosition.asset.value || 0;

  const pool = usePoolForBasket([
    collType?.info?.liquidity.mintPubkey?.toBase58(),
    desiredType?.info?.liquidity.mintPubkey?.toBase58(),
  ]);

  const userDeposits = useUserDeposits();
  const collateralDeposit = userDeposits.userDeposits.find(
    u =>
      u.reserve.info.liquidity.mintPubkey.toBase58() ===
      collType?.info?.liquidity.mintPubkey?.toBase58(),
  );

  const enrichedPools = useEnrichedPools(pool ? [pool] : []);

  return {
    enrichedPools,
    collateralDeposit,
    collType,
    desiredType,
    collValue,
    desiredValue,
    leverage: newPosition.leverage,
    pool,
  };
}
