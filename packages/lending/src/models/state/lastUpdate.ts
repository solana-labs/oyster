import BN from 'bn.js';

export interface LastUpdate {
  slot: BN;
  stale: boolean;
}
