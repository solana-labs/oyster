import { ParsedAccount } from '@oyster/common';
import { Governance, Proposal } from '../models/accounts';
import { useIsBeyondTimestamp } from './useIsBeyondTimestamp';

export const useHasVoteTimeExpired = (
  governance: ParsedAccount<Governance>,
  proposal: ParsedAccount<Proposal>,
) => {
  return useIsBeyondTimestamp(
    proposal.info.votingAt
      ? proposal.info.votingAt.toNumber() + governance.info.config.maxVotingTime
      : undefined,
  );
};
