import { ParsedAccount } from '@oyster/common';
import { Governance, Proposal } from '../models/accounts';
import { useIsBeyondSlot } from './useIsBeyondSlot';

export const useHasVotingTimeExpired = (
  governance: ParsedAccount<Governance>,
  proposal: ParsedAccount<Proposal>,
) => {
  return useIsBeyondSlot(
    proposal.info.votingAt
      ? proposal.info.votingAt.toNumber() +
          governance.info.config.maxVotingTime.toNumber()
      : undefined,
  );
};
