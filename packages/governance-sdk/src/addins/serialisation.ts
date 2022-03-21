import { GovernanceAddinAccountClass, MaxVoterWeightRecord } from './accounts';
import { BorshAccountParser } from '../core/serialisation';

export const GOVERNANCE_ADDINS_SCHEMA = new Map<any, any>([
  [
    MaxVoterWeightRecord,
    {
      kind: 'struct',
      fields: [
        ['accountDiscriminator', [8]],
        ['realm', 'pubkey'],
        ['governingTokenMint', 'pubkey'],
        ['maxVoterWeight', 'u64'],
        ['maxVoterWeightExpiry', 'u64'],
      ],
    },
  ],
]);

export const GovernanceAddinAccountParser = (
  classType: GovernanceAddinAccountClass,
) => BorshAccountParser(classType, _ => GOVERNANCE_ADDINS_SCHEMA);
