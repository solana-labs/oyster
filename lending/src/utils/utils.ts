import { getTokenName, KnownTokenMap } from '@packages/common/utils/utils';
import { PoolInfo } from '../models';

export function getPoolName(map: KnownTokenMap, pool: PoolInfo, shorten = true) {
  const sorted = pool.pubkeys.holdingMints.map((a) => a.toBase58()).sort();
  return sorted.map((item) => getTokenName(map, item, shorten)).join('/');
}
