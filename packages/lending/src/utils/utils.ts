import { KnownTokenMap, utils } from '@oyster/common';
import { PoolInfo } from '../models';

export function getPoolName(
  map: KnownTokenMap,
  pool: PoolInfo,
  shorten = true,
) {
  const sorted = pool.pubkeys.holdingMints.map(a => a.toBase58()).sort();
  return sorted.map(item => utils.getTokenName(map, item, shorten)).join('/');
}
