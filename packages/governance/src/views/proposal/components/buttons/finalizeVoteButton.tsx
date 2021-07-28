import { ParsedAccount } from '@oyster/common';
import { Button } from 'antd';
import React from 'react';

import { LABELS } from '../../../../constants';

import { contexts } from '@oyster/common';

import {
  Governance,
  Proposal,
  ProposalState,
} from '../../../../models/accounts';

import { finalizeVote } from '../../../../actions/finalizeVote';
import { useHasVotingTimeExpired } from '../../../../hooks/useHasVotingTimeExpired';
import { useRpcContext } from '../../../../hooks/useRpcContext';

const { useWallet } = contexts.Wallet;

export function FinalizeVoteButton({
  governance,
  proposal,
}: {
  governance: ParsedAccount<Governance>;
  proposal: ParsedAccount<Proposal>;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();
  const hasVotingTimeExpired = useHasVotingTimeExpired(governance, proposal);

  const isVisible =
    hasVotingTimeExpired === true &&
    connected &&
    proposal.info.state === ProposalState.Voting;

  return isVisible ? (
    <Button
      type="primary"
      onClick={async () => {
        try {
          await finalizeVote(rpcContext, proposal);
        } catch (ex) {
          console.error(ex);
        }
      }}
    >
      {LABELS.FINALIZE_VOTE}
    </Button>
  ) : null;
}
